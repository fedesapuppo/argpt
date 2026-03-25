require "set"

module Argpt
  module Pipeline
    class Fetch
      HISTORICAL_TYPE_MAP = {
        arg_stock: "stocks"
      }.freeze

      def initialize(config_path:, output_dir:, data912:, finance_query:)
        @config_path = config_path
        @output_dir = output_dir
        @data912 = data912
        @finance_query = finance_query
      end

      def call
        entries = Config.new(path: @config_path).call
        entry_by_ticker = entries.each_with_object({}) do |e, h|
          h[e[:ticker]] = e if !h.key?(e[:ticker]) || e[:type] == :us_stock
        end

        mep_data = @data912.mep_rates
        ccl_data = @data912.ccl_rates
        mep = mep_data.empty? ? nil : Portfolio::ExchangeRate.best_mep(mep_data)
        ccl = ccl_data.empty? ? nil : Portfolio::ExchangeRate.best_ccl(ccl_data)

        prices = PriceFetcher.new(data912: @data912, entries:, finance_query: @finance_query).call

        unique_tickers = entry_by_ticker.keys
        technicals = fetch_technicals(unique_tickers, entry_by_ticker)
        fundamentals = fetch_fundamentals(unique_tickers, entry_by_ticker)

        exchange_rates = {}
        exchange_rates[:mep] = { ticker: mep.ticker, bid: mep.bid, ask: mep.ask, mark: mep.mark } if mep
        exchange_rates[:ccl] = { ticker: ccl.ticker, bid: ccl.bid, ask: ccl.ask, mark: ccl.mark } if ccl

        Writer.new(output_dir: @output_dir).call(
          exchange_rates:, prices:, technicals:, fundamentals:
        )

        { tickers_count: unique_tickers.length, output_dir: @output_dir }
      end

      private

      def fq_symbol(ticker, entry)
        entry[:type] == :arg_stock ? "#{ticker}.BA" : ticker
      end

      def fetch_technicals(tickers, entry_by_ticker)
        tickers.each_with_object({}) do |ticker, result|
          entry = entry_by_ticker[ticker]
          fq_sym = fq_symbol(ticker, entry)
          raw = @finance_query.indicators(fq_sym, interval: "ONE_DAY", range: "THREE_MONTHS")
          indicators = raw[:indicators] || raw

          historical = fetch_historical(ticker, entry[:type])

          result[ticker] = Technicals::Analyzer.new(indicators:, historical:).call
        rescue Argpt::GraphqlError, Argpt::HttpError => e
          warn "  [skip technicals] #{ticker}: #{e.message}"
        end
      end

      def fetch_fundamentals(tickers, entry_by_ticker)
        tickers.each_with_object({}) do |ticker, result|
          entry = entry_by_ticker[ticker]
          fq_sym = fq_symbol(ticker, entry)
          quote = @finance_query.quote(fq_sym)
          next unless quote

          result[ticker] = Fundamentals::Analyzer.new(quote:).call
        rescue Argpt::GraphqlError, Argpt::HttpError => e
          warn "  [skip fundamentals] #{ticker}: #{e.message}"
        end
      end

      def fetch_historical(ticker, type)
        hist_type = HISTORICAL_TYPE_MAP[type]
        return nil unless hist_type

        @data912.historical(hist_type, ticker)
      rescue Argpt::HttpError, Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNRESET
        nil
      end
    end
  end
end
