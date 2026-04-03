require "roo"

module Argpt
  module Import
    class Balanz
      SHEET = "resultados_por_lotes_finales"
      TYPE_MAP = {
        "Cedears" => :cedear,
        "Acciones" => :arg_stock
      }.freeze

      REQUIRED_COLUMNS = %w[Cantidad Fecha Precio\ Compra Ticker Tipo DolarMEP].freeze

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

        col = build_column_index(sheet.row(1))

        sheet.drop(1).filter_map do |row|
          tipo = row[col["Tipo"]]
          next unless TYPE_MAP.key?(tipo)

          {
            ticker: row[col["Ticker"]],
            type: TYPE_MAP.fetch(tipo),
            qty: row[col["Cantidad"]].to_f,
            price: row[col["Precio Compra"]].to_f,
            date: parse_date(row[col["Fecha"]]),
            mep: row[col["DolarMEP"]].to_f
          }
        end
      end

      def build_column_index(header_row)
        index = {}
        header_row.each_with_index { |name, i| index[name] = i }

        missing = REQUIRED_COLUMNS - index.keys
        raise Argpt::Error, "Missing columns in spreadsheet: #{missing.join(', ')}" if missing.any?

        index
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

            ref = ticker_lots.max_by { |l| l[:date] || Date.new(0) }
            [build_holding(ticker, ref[:type], free_shares, 0.01, ref[:date], ref[:mep].positive? ? ref[:mep] : nil)]
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
