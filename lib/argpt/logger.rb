module Argpt
  module Logger
    @output = $stderr

    class << self
      attr_accessor :output

      def info(section, ticker, message)
        log("INFO", section, ticker, message)
      end

      def warn(section, ticker, message)
        log("WARN", section, ticker, message)
      end

      def error(section, ticker, message)
        log("ERROR", section, ticker, message)
      end

      private

      def log(level, section, ticker, message)
        @output.puts "[#{level}] [#{section}] #{ticker}: #{message}"
      end
    end
  end
end
