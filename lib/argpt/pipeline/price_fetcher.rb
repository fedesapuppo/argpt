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

      def initialize(data912:, entries:)
        @data912 = data912
        @entries = entries
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
        end

        result
      end
    end
  end
end
