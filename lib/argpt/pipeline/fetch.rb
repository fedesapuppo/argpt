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
        @skipped = []
      end

      def call
        entries = Config.new(path: @config_path).call
        entry_by_ticker = entries.each_with_object({}) do |e, h|
          h[e[:ticker]] = e if !h.key?(e[:ticker]) || e[:type] == :us_stock
        end

        mep_data = @data912.mep_rates
        ccl_data = @data912.ccl_rates
        mep = mep_data.empty? ? nil : Portfolio::ExchangeRate.best(mep_data)
        ccl = ccl_data.empty? ? nil : Portfolio::ExchangeRate.best(ccl_data)

        prices = PriceFetcher.new(data912: @data912, entries:, finance_query: @finance_query).call

        unique_tickers = entry_by_ticker.keys
        fundamentals = fetch_fundamentals(unique_tickers, entry_by_ticker)
        enrich_cedear_ratios(fundamentals, entry_by_ticker)
        technicals = fetch_technicals(unique_tickers, entry_by_ticker, fundamentals)

        exchange_rates = {}
        exchange_rates[:mep] = { ticker: mep.ticker, bid: mep.bid, ask: mep.ask, mark: mep.mark } if mep
        exchange_rates[:ccl] = { ticker: ccl.ticker, bid: ccl.bid, ask: ccl.ask, mark: ccl.mark } if ccl

        Writer.new(output_dir: @output_dir).call(
          exchange_rates:, prices:, technicals:, fundamentals:
        )

        { tickers_count: unique_tickers.length, output_dir: @output_dir, skipped: @skipped }
      end

      private

      TICKER_ALIASES = { "BRKB" => "BRK-B" }.freeze

      def fq_symbol(ticker, entry)
        base = ticker.sub(/\.C$/, '')
        base = TICKER_ALIASES.fetch(base, base)
        entry[:type] == :arg_stock ? "#{base}.BA" : base
      end

      def fetch_technicals(tickers, entry_by_ticker, fundamentals)
        tickers.each_with_object({}) do |ticker, result|
          entry = entry_by_ticker[ticker]
          fq_sym = fq_symbol(ticker, entry)
          raw = @finance_query.indicators(fq_sym, interval: "ONE_DAY", range: "THREE_MONTHS")
          indicators = raw[:indicators] || raw

          historical = fetch_historical(ticker, entry[:type])
          fund = fundamentals[ticker]

          result[ticker] = Technicals::Analyzer.new(
            indicators:,
            historical:,
            fifty_two_week_high: fund&.dig(:fifty_two_week_high),
            current_price: fund&.dig(:current_price)
          ).call
        rescue Argpt::GraphqlError, Argpt::HttpError => e
          @skipped << { ticker:, section: :technicals, reason: e.message }
          Argpt::Logger.warn("technicals", ticker, e.message)
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
          @skipped << { ticker:, section: :fundamentals, reason: e.message }
          Argpt::Logger.warn("fundamentals", ticker, e.message)
        end
      end

      def enrich_cedear_ratios(fundamentals, entry_by_ticker)
        cedear_tickers = entry_by_ticker.select { |_, e| e[:type] == :cedear }.keys
        return if cedear_tickers.empty?

        ba_symbols = cedear_tickers.map { |t| cedear_ba_symbol(t) }
        quotes = @finance_query.quotes(ba_symbols)
        return unless quotes.is_a?(Hash) && quotes[:quotes]

        cedear_tickers.each do |ticker|
          ba_sym = cedear_ba_symbol(ticker).to_sym
          short_name = quotes[:quotes].dig(ba_sym, :shortName)
          next unless short_name

          ratio = parse_cedear_ratio(short_name)
          fundamentals[ticker][:cedear_ratio] = ratio if ratio && fundamentals[ticker]
        end
      rescue Argpt::HttpError => e
        @skipped << { ticker: "cedear_ratios", section: :fundamentals, reason: e.message }
        Argpt::Logger.warn("fundamentals", "cedear_ratios", e.message)
      end

      def cedear_ba_symbol(ticker)
        base = ticker.sub(/\.C$/, '')
        base = TICKER_ALIASES.fetch(base, base)
        "#{base}.BA"
      end

      RATIO_PATTERN = /(?:REPR\s+(\d+)\/(\d+)|EACH\s+(\d+))/i

      def parse_cedear_ratio(short_name)
        match = short_name.match(RATIO_PATTERN)
        return nil unless match

        if match[1]
          "#{match[1]}:#{match[2]}"
        else
          "1:#{match[3]}"
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
