require "spec_helper"

RSpec.describe Argpt::Technicals::Analyzer do
  def indicators
    {
      rsi14: 38.91,
      macd: { histogram: -2.15, macd: -5.83, signal: -3.68 },
      stochastic: { "%K": 24.56, "%D": 31.12 },
      sma20: 255.30, sma50: 240.15, sma200: 228.70,
      bollingerBands: { lower: 238.50, middle: 255.30, upper: 272.10 },
      supertrend: { trend: "down", value: 263.44 },
      atr14: 5.57
    }
  end

  def historical
    [
      { date: "2026-03-18", open: 5100.0, high: 5250.0, low: 5050.0, close: 5200.0, volume: 1500000 },
      { date: "2026-03-17", open: 5000.0, high: 5150.0, low: 4980.0, close: 5100.0, volume: 1200000 },
      { date: "2026-03-16", open: 4900.0, high: 5300.0, low: 4850.0, close: 5050.0, volume: 1100000 }
    ]
  end

  describe "indicator extraction" do
    it "extracts rsi14" do
      result = Argpt::Technicals::Analyzer.new(indicators:).call

      expect(result[:rsi14]).to eq(38.91)
    end

    it "extracts macd components" do
      result = Argpt::Technicals::Analyzer.new(indicators:).call

      expect(result[:macd]).to eq({ histogram: -2.15, macd: -5.83, signal: -3.68 })
    end

    it "extracts stochastic k and d" do
      result = Argpt::Technicals::Analyzer.new(indicators:).call

      expect(result[:stochastic_k]).to eq(24.56)
      expect(result[:stochastic_d]).to eq(31.12)
    end

    it "extracts supertrend" do
      result = Argpt::Technicals::Analyzer.new(indicators:).call

      expect(result[:supertrend_value]).to eq(263.44)
      expect(result[:supertrend_trend]).to eq("down")
    end

    it "extracts moving averages" do
      result = Argpt::Technicals::Analyzer.new(indicators:).call

      expect(result[:sma20]).to eq(255.30)
      expect(result[:sma50]).to eq(240.15)
      expect(result[:sma200]).to eq(228.70)
    end

    it "extracts bollinger bands" do
      result = Argpt::Technicals::Analyzer.new(indicators:).call

      expect(result[:bollinger_upper]).to eq(272.10)
      expect(result[:bollinger_middle]).to eq(255.30)
      expect(result[:bollinger_lower]).to eq(238.50)
    end

    it "extracts atr14" do
      result = Argpt::Technicals::Analyzer.new(indicators:).call

      expect(result[:atr14]).to eq(5.57)
    end

    it "handles missing indicator fields as nil" do
      result = Argpt::Technicals::Analyzer.new(indicators: { rsi14: 50.0 }).call

      expect(result[:rsi14]).to eq(50.0)
      expect(result[:macd]).to be_nil
      expect(result[:sma50]).to be_nil
    end
  end

  describe "ATH calculation" do
    it "computes ATH from historical highs" do
      result = Argpt::Technicals::Analyzer.new(indicators:, historical:).call

      expect(result[:ath]).to eq(5300.0)
    end

    it "computes pct_below_ath" do
      result = Argpt::Technicals::Analyzer.new(indicators:, historical:).call

      # ATH = 5300, current close = 5200 (first entry)
      expected = (5300.0 - 5200.0) / 5300.0 * 100
      expect(result[:pct_below_ath]).to be_within(0.01).of(expected)
    end

    it "returns nil ATH when no historical data" do
      result = Argpt::Technicals::Analyzer.new(indicators:).call

      expect(result[:ath]).to be_nil
      expect(result[:pct_below_ath]).to be_nil
    end

    it "returns nil ATH when historical is empty" do
      result = Argpt::Technicals::Analyzer.new(indicators:, historical: []).call

      expect(result[:ath]).to be_nil
      expect(result[:pct_below_ath]).to be_nil
    end
  end

  describe "52-week high fallback" do
    it "computes pct_below_ath from fifty_two_week_high when no historical data" do
      result = Argpt::Technicals::Analyzer.new(
        indicators:,
        fifty_two_week_high: 288.62,
        current_price: 251.12
      ).call

      expected = (288.62 - 251.12) / 288.62 * 100
      expect(result[:ath]).to eq(288.62)
      expect(result[:pct_below_ath]).to be_within(0.01).of(expected)
    end

    it "prefers historical data over fifty_two_week_high" do
      result = Argpt::Technicals::Analyzer.new(
        indicators:,
        historical:,
        fifty_two_week_high: 288.62,
        current_price: 251.12
      ).call

      expect(result[:ath]).to eq(5300.0)
    end

    it "returns nil when fifty_two_week_high is nil and no historical" do
      result = Argpt::Technicals::Analyzer.new(
        indicators:,
        fifty_two_week_high: nil,
        current_price: 251.12
      ).call

      expect(result[:ath]).to be_nil
      expect(result[:pct_below_ath]).to be_nil
    end
  end
end
