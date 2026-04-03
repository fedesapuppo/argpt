module Argpt
  module Import
    class SpinoffPricer
      TYPE_MAP = { cedear: "cedears", arg_stock: "stocks" }.freeze

      def initialize(holdings:, data912:)
        @holdings = holdings
        @data912 = data912
      end

      def call
        @holdings.map { |h| spinoff?(h) ? resolve(h) : h }
      end

      private

      def spinoff?(holding)
        holding.avg_price <= 0.01 && holding.purchase_date
      end

      def resolve(holding)
        history_type = TYPE_MAP.fetch(holding.type)
        history = @data912.historical(history_type, holding.ticker)
        return holding unless history.is_a?(Array)

        close = find_close(history, holding.purchase_date)
        return holding unless close

        Portfolio::Holding.new(
          ticker: holding.ticker,
          type: holding.type,
          shares: holding.shares,
          avg_price: close,
          purchase_date: holding.purchase_date,
          purchase_fx_rate: holding.purchase_fx_rate,
          broker: holding.broker
        )
      rescue Argpt::HttpError, Argpt::ServerError
        holding
      end

      def find_close(history, date)
        target = date.to_s
        exact = history.find { |h| h[:date] == target }
        return closing(exact) if exact

        earlier = history.select { |h| h[:date] < target }.max_by { |h| h[:date] }
        closing(earlier)
      end

      def closing(entry)
        return nil unless entry

        entry[:close] || entry[:c]
      end
    end
  end
end
