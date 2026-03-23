module Argpt
  module Portfolio
    module ExchangeRate
      PREFERRED_TICKER = "AL30"
      Rate = Data.define(:ticker, :bid, :ask, :mark)

      def self.best_mep(rates_data)
        select_best(rates_data)
      end

      def self.best_ccl(rates_data)
        select_best(rates_data)
      end

      def self.select_best(rates_data)
        raise Argpt::Error, "No rate data available" if rates_data.empty?

        entry = rates_data.find { |r| r[:ticker] == PREFERRED_TICKER } || rates_data.first
        Rate.new(ticker: entry[:ticker], bid: entry[:buy], ask: entry[:sell], mark: entry[:rate])
      end
      private_class_method :select_best
    end
  end
end
