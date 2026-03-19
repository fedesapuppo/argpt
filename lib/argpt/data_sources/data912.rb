module Argpt
  module DataSources
    class Data912
      BASE_URL = "https://data912.com"

      def initialize(client:)
        @client = client
      end

      def mep_rates
        @client.get("#{BASE_URL}/live/mep")
      end

      def ccl_rates
        @client.get("#{BASE_URL}/live/ccl")
      end

      def arg_stocks
        @client.get("#{BASE_URL}/live/arg_stocks")
      end

      def arg_cedears
        @client.get("#{BASE_URL}/live/arg_cedears")
      end

      def usa_stocks
        @client.get("#{BASE_URL}/live/usa_stocks")
      end

      def historical(type, ticker)
        @client.get("#{BASE_URL}/historical/#{type}/#{ticker}")
      end
    end
  end
end
