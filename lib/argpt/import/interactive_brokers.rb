require "csv"

module Argpt
  module Import
    class InteractiveBrokers
      def initialize(path:)
        @path = path
      end

      def call
        holdings = []

        CSV.foreach(@path) do |row|
          next unless row[0] == "Open Positions"
          next unless row[1] == "Data" && row[2] == "Summary"

          ticker = row[5]
          shares = parse_numeric(row[6], "shares")
          cost_price = parse_numeric(row[8], "cost price")

          holdings << Portfolio::Holding.new(
            ticker:,
            type: :us_stock,
            shares:,
            avg_price: cost_price,
            purchase_date: nil,
            broker: :ib
          )
        end

        holdings
      end

      private

      def parse_numeric(value, field)
        Float(value)
      rescue ArgumentError, TypeError
        raise Argpt::Error, "Non-numeric #{field}: #{value.inspect}"
      end
    end
  end
end
