require "yaml"

module Argpt
  module Pipeline
    class Config
      def initialize(path:)
        @path = path
      end

      def call
        @entries ||= parse
      end

      def by_type
        call.group_by { |entry| entry[:type] }
      end

      private

      def parse
        data = YAML.safe_load_file(@path, symbolize_names: true)
        raise Argpt::Error, "Config missing tickers key" unless data.is_a?(Hash) && data.key?(:tickers)
        raise Argpt::Error, "Config tickers must be an array" unless data[:tickers].is_a?(Array)

        data[:tickers].map do |entry|
          type = entry[:type].to_sym
          raise Argpt::Error, "Invalid type: #{type}" unless Portfolio::Holding::VALID_TYPES.include?(type)

          { ticker: entry[:ticker], type: }
        end
      end
    end
  end
end
