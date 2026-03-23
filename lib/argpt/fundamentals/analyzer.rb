module Argpt
  module Fundamentals
    class Analyzer
      ABSOLUTE_THRESHOLDS = {
        pe:             { direction: :lower,  green: 15, yellow: 25 },
        roe:            { direction: :higher, green: 15, yellow: 10 },
        debt_to_equity: { direction: :lower,  green: 1,  yellow: 2 },
        profit_margin:  { direction: :higher, green: 20, yellow: 10 }
      }.freeze

      RELATIVE_MULTIPLIERS = {
        pe:             { direction: :lower,  yellow: 1.5 },
        roe:            { direction: :higher, yellow: 0.5 },
        debt_to_equity: { direction: :lower,  yellow: 2.0 },
        profit_margin:  { direction: :higher, yellow: 0.5 }
      }.freeze

      def initialize(quote:)
        @quote = quote
        @benchmarks = SectorBenchmarks.for(@quote[:sector])
      end

      def call
        pe = safe_divide(@quote[:regularMarketPrice], @quote[:trailingEps])
        forward_pe = safe_divide(@quote[:regularMarketPrice], @quote[:forwardEps])
        roe = to_pct(@quote[:returnOnEquity])
        profit_margin = to_pct(@quote[:profitMargins])
        operating_margin = to_pct(@quote[:operatingMargins])
        dividend_yield = to_pct(@quote[:dividendYield])
        eps_growth = to_pct(@quote[:earningsGrowth])

        {
          pe:,
          forward_pe:,
          pb: @quote[:priceToBook],
          roe:,
          eps_growth:,
          dividend_yield:,
          debt_to_equity: numeric_or_nil(@quote[:debtToEquity]),
          profit_margin:,
          operating_margin:,
          sector: @quote[:sector],
          industry: @quote[:industry],
          fifty_two_week_high: @quote[:fiftyTwoWeekHigh],
          fifty_two_week_low: @quote[:fiftyTwoWeekLow],
          market_cap: @quote[:marketCap],
          thresholds: {
            pe: threshold(:pe, pe),
            roe: threshold(:roe, roe),
            debt_to_equity: threshold(:debt_to_equity, @quote[:debtToEquity]),
            profit_margin: threshold(:profit_margin, profit_margin)
          }
        }
      end

      private

      def safe_divide(numerator, denominator)
        return nil if numerator.nil? || denominator.nil?
        return nil unless numerator.is_a?(Numeric) && denominator.is_a?(Numeric)
        return nil if denominator.zero?

        numerator.to_f / denominator
      end

      def numeric_or_nil(value)
        value.is_a?(Numeric) ? value : nil
      end

      def to_pct(value)
        return nil unless value.is_a?(Numeric)

        value * 100
      end

      def threshold(metric, value)
        return nil unless value.is_a?(Numeric)

        benchmark = @benchmarks&.dig(metric)
        benchmark ? relative_threshold(metric, value, benchmark) : absolute_threshold(metric, value)
      end

      def relative_threshold(metric, value, benchmark)
        spec = RELATIVE_MULTIPLIERS.fetch(metric)

        if spec[:direction] == :lower
          if value <= benchmark then :green
          elsif value <= benchmark * spec[:yellow] then :yellow
          else :red
          end
        else
          if value >= benchmark then :green
          elsif value >= benchmark * spec[:yellow] then :yellow
          else :red
          end
        end
      end

      def absolute_threshold(metric, value)
        spec = ABSOLUTE_THRESHOLDS.fetch(metric)

        if spec[:direction] == :lower
          if value < spec[:green] then :green
          elsif value <= spec[:yellow] then :yellow
          else :red
          end
        else
          if value > spec[:green] then :green
          elsif value >= spec[:yellow] then :yellow
          else :red
          end
        end
      end
    end
  end
end
