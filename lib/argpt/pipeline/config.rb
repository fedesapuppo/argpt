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
        data[:tickers].map do |entry|
          type = entry[:type].to_sym
          raise Argpt::Error, "Invalid type: #{type}" unless Portfolio::Holding::VALID_TYPES.include?(type)

          { ticker: entry[:ticker], type: }
        end
      end
    end
  end
end
