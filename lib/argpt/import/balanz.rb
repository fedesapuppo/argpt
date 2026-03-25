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
        per_lot_holdings(lots)
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

      def per_lot_holdings(lots)
        by_ticker = lots.group_by { |l| l[:ticker] }

        by_ticker.flat_map do |ticker, ticker_lots|
          max_price = ticker_lots.map { |l| l[:price] }.max
          threshold = max_price * 0.01
          paid = ticker_lots.select { |l| l[:price] > threshold }
          free = ticker_lots.select { |l| l[:price] <= threshold }
          free_shares = free.sum { |l| l[:qty] }

          if paid.empty?
            next [] if free_shares.zero?

            [build_holding(ticker, ticker_lots.first[:type], free_shares, 0.01, nil, nil)]
          else
            extra_per_lot = paid.length > 0 ? free_shares / paid.length : 0

            paid.map do |lot|
              new_shares = lot[:qty] + extra_per_lot
              adjusted_price = lot[:price] * lot[:qty] / new_shares

              build_holding(
                ticker, lot[:type],
                new_shares,
                adjusted_price,
                lot[:date],
                lot[:mep].positive? ? lot[:mep] : nil
              )
            end
          end
        end.compact
      end

      def build_holding(ticker, type, shares, price, date, mep)
        Portfolio::Holding.new(
          ticker:,
          type:,
          shares:,
          avg_price: [price, 0.01].max,
          purchase_date: date,
          purchase_fx_rate: mep,
          broker: :balanz
        )
      end
    end
  end
end
