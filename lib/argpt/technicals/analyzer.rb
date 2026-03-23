module Argpt
  module Technicals
    class Analyzer
      def initialize(indicators:, historical: nil)
        @indicators = indicators
        @historical = historical
      end

      def call
        result = extract_indicators
        result.merge!(compute_ath) if @historical.is_a?(Array) && @historical.any?
        result
      end

      private

      def extract_indicators
        stochastic = @indicators[:stochastic]
        supertrend = @indicators[:supertrend]
        bollinger = @indicators[:bollingerBands]

        {
          rsi14: @indicators[:rsi14],
          macd: @indicators[:macd],
          stochastic_k: stochastic&.dig(:"%K"),
          stochastic_d: stochastic&.dig(:"%D"),
          supertrend_value: supertrend&.dig(:value),
          supertrend_trend: supertrend&.dig(:trend),
          sma20: @indicators[:sma20],
          sma50: @indicators[:sma50],
          sma200: @indicators[:sma200],
          bollinger_upper: bollinger&.dig(:upper),
          bollinger_middle: bollinger&.dig(:middle),
          bollinger_lower: bollinger&.dig(:lower),
          atr14: @indicators[:atr14],
          ath: nil,
          pct_below_ath: nil
        }
      end

      def compute_ath
        highs = @historical.filter_map { |h| h[:high] }
        return { ath: nil, pct_below_ath: nil } if highs.empty?

        ath = highs.max
        current_close = @historical.first[:close]
        pct_below = ath&.positive? && current_close ? (ath - current_close) / ath * 100 : nil

        { ath:, pct_below_ath: pct_below }
      end
    end
  end
end
