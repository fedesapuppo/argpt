module Argpt
  module Pipeline
    class Writer
      def initialize(output_dir:)
        @output_dir = output_dir
      end

      def call(exchange_rates:, prices:, technicals:, fundamentals:)
        FileUtils.mkdir_p(@output_dir)

        merged_rates = preserve_exchange_rates(exchange_rates)

        data = {
          exchange_rates: merged_rates.merge(fetched_at: Time.now.iso8601),
          prices: prices,
          technicals: technicals,
          fundamentals: fundamentals
        }

        data.each do |name, content|
          path = File.join(@output_dir, "#{name}.json")
          File.write(path, JSON.pretty_generate(content))
        end
      end
      private

      def preserve_exchange_rates(new_rates)
        path = File.join(@output_dir, "exchange_rates.json")
        return new_rates unless File.exist?(path)

        existing = JSON.parse(File.read(path), symbolize_names: true)
        result = {}
        %i[mep ccl].each do |key|
          result[key] = new_rates[key] || existing[key]
        end
        result
      end
    end
  end
end
