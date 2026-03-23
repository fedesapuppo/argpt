require "spec_helper"

RSpec.describe Argpt::Fundamentals::Analyzer do
  def quote(overrides = {})
    {
      regularMarketPrice: 251.12,
      trailingEps: 7.91,
      forwardEps: 9.32,
      priceToBook: 41.87,
      returnOnEquity: 1.5202,
      profitMargins: 0.2704,
      operatingMargins: 0.3537,
      debtToEquity: 102.63,
      dividendYield: 0.0042,
      earningsGrowth: 0.104,
      fiftyTwoWeekHigh: 288.62,
      fiftyTwoWeekLow: 169.21,
      sector: "Technology",
      industry: "Consumer Electronics",
      shortName: "Apple Inc.",
      marketCap: 3_800_000_000_000
    }.merge(overrides)
  end

  describe "P/E computation" do
    it "computes trailing PE from price and eps" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:pe]).to be_within(0.01).of(251.12 / 7.91)
    end

    it "computes forward PE" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:forward_pe]).to be_within(0.01).of(251.12 / 9.32)
    end

    it "returns nil PE when trailingEps is nil" do
      result = Argpt::Fundamentals::Analyzer.new(quote: quote(trailingEps: nil)).call

      expect(result[:pe]).to be_nil
    end

    it "returns nil PE when trailingEps is zero" do
      result = Argpt::Fundamentals::Analyzer.new(quote: quote(trailingEps: 0)).call

      expect(result[:pe]).to be_nil
    end

    it "returns nil PE when price is nil" do
      result = Argpt::Fundamentals::Analyzer.new(quote: quote(regularMarketPrice: nil)).call

      expect(result[:pe]).to be_nil
      expect(result[:forward_pe]).to be_nil
    end
  end

  describe "field extraction" do
    it "extracts price-to-book" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:pb]).to eq(41.87)
    end

    it "converts ROE to percentage" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:roe]).to be_within(0.01).of(152.02)
    end

    it "converts profit margin to percentage" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:profit_margin]).to be_within(0.01).of(27.04)
    end

    it "converts operating margin to percentage" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:operating_margin]).to be_within(0.01).of(35.37)
    end

    it "converts dividend yield to percentage" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:dividend_yield]).to be_within(0.01).of(0.42)
    end

    it "converts earnings growth to percentage" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:eps_growth]).to be_within(0.01).of(10.4)
    end

    it "passes through debt_to_equity as-is" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:debt_to_equity]).to eq(102.63)
    end

    it "extracts sector and industry" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:sector]).to eq("Technology")
      expect(result[:industry]).to eq("Consumer Electronics")
    end

    it "extracts 52-week range and market cap" do
      result = Argpt::Fundamentals::Analyzer.new(quote:).call

      expect(result[:fifty_two_week_high]).to eq(288.62)
      expect(result[:fifty_two_week_low]).to eq(169.21)
      expect(result[:market_cap]).to eq(3_800_000_000_000)
    end

    it "handles nil values gracefully" do
      result = Argpt::Fundamentals::Analyzer.new(quote: quote(returnOnEquity: nil, profitMargins: nil)).call

      expect(result[:roe]).to be_nil
      expect(result[:profit_margin]).to be_nil
    end
  end

  describe "color thresholds" do
    context "P/E" do
      it "green when < 15" do
        result = Argpt::Fundamentals::Analyzer.new(quote: quote(regularMarketPrice: 100.0, trailingEps: 10.0)).call

        expect(result[:thresholds][:pe]).to eq(:green)
      end

      it "yellow when 15-25" do
        result = Argpt::Fundamentals::Analyzer.new(quote: quote(regularMarketPrice: 200.0, trailingEps: 10.0)).call

        expect(result[:thresholds][:pe]).to eq(:yellow)
      end

      it "red when > 25" do
        result = Argpt::Fundamentals::Analyzer.new(quote:).call

        expect(result[:thresholds][:pe]).to eq(:red)
      end
    end

    context "ROE" do
      it "green when > 15%" do
        result = Argpt::Fundamentals::Analyzer.new(quote:).call

        expect(result[:thresholds][:roe]).to eq(:green)
      end

      it "yellow when 10-15%" do
        result = Argpt::Fundamentals::Analyzer.new(quote: quote(returnOnEquity: 0.12)).call

        expect(result[:thresholds][:roe]).to eq(:yellow)
      end

      it "red when < 10%" do
        result = Argpt::Fundamentals::Analyzer.new(quote: quote(returnOnEquity: 0.05)).call

        expect(result[:thresholds][:roe]).to eq(:red)
      end
    end

    context "Debt/Equity" do
      it "green when < 1" do
        result = Argpt::Fundamentals::Analyzer.new(quote: quote(debtToEquity: 0.5)).call

        expect(result[:thresholds][:debt_to_equity]).to eq(:green)
      end

      it "yellow when 1-2" do
        result = Argpt::Fundamentals::Analyzer.new(quote: quote(debtToEquity: 1.5)).call

        expect(result[:thresholds][:debt_to_equity]).to eq(:yellow)
      end

      it "red when > 2" do
        result = Argpt::Fundamentals::Analyzer.new(quote:).call

        expect(result[:thresholds][:debt_to_equity]).to eq(:red)
      end
    end

    context "Profit Margin" do
      it "green when > 20%" do
        result = Argpt::Fundamentals::Analyzer.new(quote:).call

        expect(result[:thresholds][:profit_margin]).to eq(:green)
      end

      it "yellow when 10-20%" do
        result = Argpt::Fundamentals::Analyzer.new(quote: quote(profitMargins: 0.15)).call

        expect(result[:thresholds][:profit_margin]).to eq(:yellow)
      end

      it "red when < 10%" do
        result = Argpt::Fundamentals::Analyzer.new(quote: quote(profitMargins: 0.05)).call

        expect(result[:thresholds][:profit_margin]).to eq(:red)
      end
    end

    it "returns nil threshold when metric is nil" do
      result = Argpt::Fundamentals::Analyzer.new(quote: quote(trailingEps: nil, returnOnEquity: nil)).call

      expect(result[:thresholds][:pe]).to be_nil
      expect(result[:thresholds][:roe]).to be_nil
    end
  end
end
