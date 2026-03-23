require "roo"

module Argpt
  module Import
    class Balanz
      SHEET = "resultados_por_lotes_finales"
      TYPE_MAP = {
        "Cedears" => :cedear,
        "Acciones" => :arg_stock
      }.freeze

      def initialize(path:)
        @path = path
      end

      def call
        lots = parse_lots
        aggregate(lots)
      end

      private

      def parse_lots
        xlsx = Roo::Spreadsheet.open(@path)
        sheet = xlsx.sheet(SHEET)

        sheet.drop(1).filter_map do |row|
          tipo = row[9]
          next unless TYPE_MAP.key?(tipo)

          {
            ticker: row[8],
            type: TYPE_MAP.fetch(tipo),
            qty: row[0].to_f,
            price: row[7].to_f,
            date: parse_date(row[2]),
            mep: row[11].to_f
          }
        end
      end

      def parse_date(val)
        case val
        when Date then val
        when String then Date.parse(val)
        else nil
        end
      end

      def aggregate(lots)
        lots.group_by { |l| l[:ticker] }.map do |ticker, ticker_lots|
          paid = ticker_lots.select { |l| l[:price].positive? }
          total_shares = ticker_lots.sum { |l| l[:qty] }
          next if total_shares.zero?

          if paid.any?
            paid_shares = paid.sum { |l| l[:qty] }
            avg_price = paid.sum { |l| l[:qty] * l[:price] } / paid_shares
            avg_mep = paid.sum { |l| l[:qty] * l[:mep] } / paid_shares
            earliest_date = paid.map { |l| l[:date] }.compact.min
          else
            avg_price = 0
            avg_mep = nil
            earliest_date = nil
          end

          Portfolio::Holding.new(
            ticker:,
            type: ticker_lots.first[:type],
            shares: total_shares,
            avg_price: [avg_price, 0.01].max,
            purchase_date: earliest_date,
            purchase_fx_rate: avg_mep&.positive? ? avg_mep : nil
          )
        end.compact
      end
    end
  end
end
