require "set"

module Argpt
  module Pipeline
    class PriceFetcher
      ENDPOINT_MAP = {
        arg_stock: :arg_stocks,
        cedear: :arg_cedears,
        us_stock: :usa_stocks
      }.freeze

      CURRENCY_MAP = {
        arg_stock: :ars,
        cedear: :ars,
        us_stock: :usd
      }.freeze

      def initialize(data912:, entries:, finance_query: nil)
        @data912 = data912
        @entries = entries
        @finance_query = finance_query
      end

      def call
        result = {}
        by_type = @entries.group_by { |e| e[:type] }

        by_type.each do |type, entries|
          endpoint = ENDPOINT_MAP.fetch(type)
          all_prices = @data912.public_send(endpoint)
          tickers = entries.map { |e| e[:ticker] }.to_set

          all_prices.each do |row|
            sym = row[:symbol] || row[:ticker]
            next unless tickers.include?(sym)

            key = "#{sym}:#{type}"
            result[key] = {
              last: row[:c] || row[:last],
              change: row[:pct_change] || row[:change] || 0,
              volume: row[:v] || row[:volume] || 0,
              currency: CURRENCY_MAP.fetch(type),
              type: type
            }
          end

          backfill_from_finance_query(result, type, tickers) if type == :us_stock && @finance_query
        end

        result
      end

      private

      def backfill_from_finance_query(result, type, tickers)
        missing = tickers.reject { |t| result.key?("#{t}:#{type}") }
        return if missing.empty?

        missing.each do |ticker|
          quote = @finance_query.quote(ticker)
          next unless quote

          price = quote[:regularMarketPrice] || quote[:price]
          change = quote[:regularMarketChangePercent] || 0
          next unless price

          result["#{ticker}:#{type}"] = {
            last: price.to_f,
            change: change.to_f,
            volume: (quote[:regularMarketVolume] || 0).to_i,
            currency: :usd,
            type: type
          }
        rescue Argpt::GraphqlError, Argpt::HttpError => e
          warn "  [skip price] #{ticker}: #{e.message}"
        end
      end
    end
  end
end
