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

      HISTORICAL_TYPES = %w[stocks cedears bonds].freeze
      SAFE_TICKER = /\A[\w.-]+\z/

      def historical(type, ticker)
        raise ArgumentError, "Invalid type: #{type}" unless HISTORICAL_TYPES.include?(type)
        raise ArgumentError, "Invalid ticker: #{ticker}" unless ticker.match?(SAFE_TICKER)

        @client.get("#{BASE_URL}/historical/#{type}/#{ticker}")
      end
    end
  end
end
