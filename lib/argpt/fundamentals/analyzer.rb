module Argpt
  module Fundamentals
    class Analyzer
      def initialize(quote:)
        @quote = quote
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
          debt_to_equity: @quote[:debtToEquity],
          profit_margin:,
          operating_margin:,
          sector: @quote[:sector],
          industry: @quote[:industry],
          fifty_two_week_high: @quote[:fiftyTwoWeekHigh],
          fifty_two_week_low: @quote[:fiftyTwoWeekLow],
          market_cap: @quote[:marketCap],
          thresholds: {
            pe: threshold_pe(pe),
            roe: threshold_roe(roe),
            debt_to_equity: threshold_debt(@quote[:debtToEquity]),
            profit_margin: threshold_margin(profit_margin)
          }
        }
      end

      private

      def safe_divide(numerator, denominator)
        return nil if numerator.nil? || denominator.nil? || denominator.zero?

        numerator.to_f / denominator
      end

      def to_pct(value)
        return nil if value.nil?

        value * 100
      end

      def threshold_pe(pe)
        return nil if pe.nil?

        if pe < 15 then :green
        elsif pe <= 25 then :yellow
        else :red
        end
      end

      def threshold_roe(roe)
        return nil if roe.nil?

        if roe > 15 then :green
        elsif roe >= 10 then :yellow
        else :red
        end
      end

      def threshold_debt(debt)
        return nil if debt.nil?

        if debt < 1 then :green
        elsif debt <= 2 then :yellow
        else :red
        end
      end

      def threshold_margin(margin)
        return nil if margin.nil?

        if margin > 20 then :green
        elsif margin >= 10 then :yellow
        else :red
        end
      end
    end
  end
end
