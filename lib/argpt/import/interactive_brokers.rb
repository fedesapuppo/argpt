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
          shares = row[6].to_f
          cost_price = row[8].to_f

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
    end
  end
end
