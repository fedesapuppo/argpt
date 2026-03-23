module Argpt
  module DataSources
    class ArgentinaDatos
      BASE_URL = "https://api.argentinadatos.com"
      FxRate = Data.define(:date, :buy, :sell, :mark)

      def initialize(client:)
        @client = client
      end

      def mep_history
        @mep_history ||= @client.get("#{BASE_URL}/v1/cotizaciones/dolares/bolsa")
      end

      def ccl_history
        @ccl_history ||= @client.get("#{BASE_URL}/v1/cotizaciones/dolares/contadoconliqui")
      end

      def mep_on(date)
        rate_on(mep_history, date, "MEP")
      end

      def ccl_on(date)
        rate_on(ccl_history, date, "CCL")
      end

      private

      def rate_on(history, date, label)
        entry = history.reverse.find { |r| Date.strptime(r[:fecha], "%Y-%m-%d") <= date }
        raise Argpt::Error, "No #{label} data available for #{date}" unless entry

        FxRate.new(
          date: Date.strptime(entry[:fecha], "%Y-%m-%d"),
          buy: entry[:compra],
          sell: entry[:venta],
          mark: (entry[:compra] + entry[:venta]) / 2.0
        )
      end
    end
  end
end
