module Argpt
  module Pipeline
    class Writer
      def initialize(output_dir:)
        @output_dir = output_dir
      end

      def call(exchange_rates:, prices:, technicals:, fundamentals:)
        FileUtils.mkdir_p(@output_dir)

        data = {
          exchange_rates: exchange_rates.merge(fetched_at: Time.now.iso8601),
          prices: prices,
          technicals: technicals,
          fundamentals: fundamentals
        }

        data.each do |name, content|
          path = File.join(@output_dir, "#{name}.json")
          File.write(path, JSON.pretty_generate(content))
        end
      end
    end
  end
end
