require "spec_helper"

RSpec.describe Argpt::Portfolio::Calculator do
  def mep_rate(mark: 1177.50)
    Argpt::Portfolio::ExchangeRate::Rate.new(ticker: "AL30", bid: mark - 2.5, ask: mark + 2.5, mark:)
  end

  def ccl_rate(mark: 1207.50)
    Argpt::Portfolio::ExchangeRate::Rate.new(ticker: "AL30", bid: mark - 2.5, ask: mark + 2.5, mark:)
  end

  def holding(ticker:, type:, shares:, avg_price:, purchase_fx_rate: nil)
    Argpt::Portfolio::Holding.new(
      ticker:, type:, shares:, avg_price:,
      purchase_date: Date.new(2025, 6, 15), purchase_fx_rate:
    )
  end

  describe "single cedear" do
    it "calculates ARS and USD prices" do
      h = holding(ticker: "AAPL", type: :cedear, shares: 50, avg_price: 14000.0, purchase_fx_rate: 1100.0)
      prices = { "AAPL" => { last: 15200.0, change: 0.8 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.current_price_ars).to eq(15200.0)
      expect(hr.current_price_usd).to be_within(0.01).of(15200.0 / 1177.50)
    end

    it "calculates ARS P&L" do
      h = holding(ticker: "AAPL", type: :cedear, shares: 50, avg_price: 14000.0)
      prices = { "AAPL" => { last: 15200.0, change: 0.8 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.pnl_ars).to be_within(0.01).of((15200.0 - 14000.0) * 50)
    end

    it "calculates real USD P&L using purchase_fx_rate" do
      h = holding(ticker: "AAPL", type: :cedear, shares: 50, avg_price: 14000.0, purchase_fx_rate: 1100.0)
      prices = { "AAPL" => { last: 15200.0, change: 0.8 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      hr = result.holdings.first
      entry_usd = 14000.0 / 1100.0
      current_usd = 15200.0 / 1177.50
      expected_pnl_usd = (current_usd - entry_usd) * 50
      expect(hr.pnl_usd).to be_within(0.01).of(expected_pnl_usd)
    end

    it "returns nil pnl_usd when purchase_fx_rate is nil" do
      h = holding(ticker: "AAPL", type: :cedear, shares: 50, avg_price: 14000.0)
      prices = { "AAPL" => { last: 15200.0, change: 0.8 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      expect(result.holdings.first.pnl_usd).to be_nil
    end

    it "calculates pnl_pct in original currency" do
      h = holding(ticker: "AAPL", type: :cedear, shares: 50, avg_price: 14000.0)
      prices = { "AAPL" => { last: 15200.0, change: 0.8 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      expected_pct = ((15200.0 - 14000.0) / 14000.0) * 100
      expect(result.holdings.first.pnl_pct).to be_within(0.01).of(expected_pct)
    end

    it "forwards daily_change_pct from price data" do
      h = holding(ticker: "AAPL", type: :cedear, shares: 50, avg_price: 14000.0)
      prices = { "AAPL" => { last: 15200.0, change: 0.8 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      expect(result.holdings.first.daily_change_pct).to eq(0.8)
    end
  end

  describe "single arg_stock" do
    it "converts ARS to USD via MEP" do
      h = holding(ticker: "GGAL", type: :arg_stock, shares: 100, avg_price: 4800.0, purchase_fx_rate: 1100.0)
      prices = { "GGAL" => { last: 5200.0, change: 2.5 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.current_price_ars).to eq(5200.0)
      expect(hr.current_price_usd).to be_within(0.01).of(5200.0 / 1177.50)
    end
  end

  describe "single us_stock" do
    it "uses USD price directly and converts to ARS via CCL" do
      h = holding(ticker: "AAPL", type: :us_stock, shares: 10, avg_price: 170.0)
      prices = { "AAPL" => { last: 185.50, change: 1.2 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.current_price_usd).to eq(185.50)
      expect(hr.current_price_ars).to be_within(0.01).of(185.50 * 1207.50)
    end

    it "calculates USD P&L directly" do
      h = holding(ticker: "AAPL", type: :us_stock, shares: 10, avg_price: 170.0)
      prices = { "AAPL" => { last: 185.50, change: 1.2 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.pnl_usd).to be_within(0.01).of((185.50 - 170.0) * 10)
      expect(hr.pnl_ars).to be_within(0.01).of((185.50 - 170.0) * 10 * 1207.50)
    end
  end

  describe "portfolio-level metrics" do
    it "sums total values" do
      h1 = holding(ticker: "GGAL", type: :arg_stock, shares: 100, avg_price: 4800.0)
      h2 = holding(ticker: "AAPL", type: :us_stock, shares: 10, avg_price: 170.0)
      prices = {
        "GGAL" => { last: 5200.0, change: 2.5 },
        "AAPL" => { last: 185.50, change: 1.2 }
      }

      result = Argpt::Portfolio::Calculator.new(holdings: [h1, h2], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      ggal_usd = 100 * 5200.0 / 1177.50
      aapl_usd = 10 * 185.50
      expect(result.total_value_usd).to be_within(0.01).of(ggal_usd + aapl_usd)
    end

    it "calculates weights summing to 100" do
      h1 = holding(ticker: "GGAL", type: :arg_stock, shares: 100, avg_price: 4800.0)
      h2 = holding(ticker: "AAPL", type: :us_stock, shares: 10, avg_price: 170.0)
      prices = {
        "GGAL" => { last: 5200.0, change: 2.5 },
        "AAPL" => { last: 185.50, change: 1.2 }
      }

      result = Argpt::Portfolio::Calculator.new(holdings: [h1, h2], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      total_weight = result.holdings.sum(&:weight_pct)
      expect(total_weight).to be_within(0.01).of(100.0)
    end

    it "gives single holding 100% weight" do
      h = holding(ticker: "GGAL", type: :arg_stock, shares: 100, avg_price: 4800.0)
      prices = { "GGAL" => { last: 5200.0, change: 2.5 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      expect(result.holdings.first.weight_pct).to eq(100.0)
    end

    it "calculates value-weighted daily change" do
      h1 = holding(ticker: "GGAL", type: :arg_stock, shares: 100, avg_price: 4800.0)
      h2 = holding(ticker: "AAPL", type: :us_stock, shares: 10, avg_price: 170.0)
      prices = {
        "GGAL" => { last: 5200.0, change: 2.5 },
        "AAPL" => { last: 185.50, change: 1.2 }
      }

      result = Argpt::Portfolio::Calculator.new(holdings: [h1, h2], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      ggal_val = 100 * 5200.0 / 1177.50
      aapl_val = 10 * 185.50
      total = ggal_val + aapl_val
      expected = (2.5 * ggal_val + 1.2 * aapl_val) / total
      expect(result.daily_change_pct).to be_within(0.01).of(expected)
    end
  end

  describe "return decomposition" do
    it "decomposes cedear where ARS gain is offset by devaluation" do
      # Bought at 1000 ARS when MEP was 1000 → entry USD = 1.00
      # Now at 1400 ARS, MEP is 1400 → current USD = 1.00
      # Capital: +40%, Currency: -28.57%, Total USD: ~0%
      h = holding(ticker: "AAPL", type: :cedear, shares: 100, avg_price: 1000.0, purchase_fx_rate: 1000.0)
      prices = { "AAPL" => { last: 1400.0, change: 0.5 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate(mark: 1400.0), ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.capital_return_pct).to be_within(0.01).of(40.0)
      expect(hr.currency_return_pct).to be_within(0.01).of(-28.57)
      expect(hr.total_return_usd_pct).to be_within(0.1).of(0.0)

      # Identity: (1 + capital) × (1 + currency) - 1 == total_return_usd
      identity = (1 + hr.capital_return_pct / 100.0) * (1 + hr.currency_return_pct / 100.0) - 1
      expect(identity * 100).to be_within(0.01).of(hr.total_return_usd_pct)
    end

    it "decomposes arg_stock with big devaluation" do
      # Bought at 1000 ARS when MEP was 700 → entry USD = 1.4286
      # Now at 2800 ARS, MEP is 1400 → current USD = 2.00
      # Capital: +180%, Currency: -50%, Total USD: +40%
      h = holding(ticker: "GGAL", type: :arg_stock, shares: 100, avg_price: 1000.0, purchase_fx_rate: 700.0)
      prices = { "GGAL" => { last: 2800.0, change: 1.0 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate(mark: 1400.0), ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.capital_return_pct).to be_within(0.01).of(180.0)
      expect(hr.currency_return_pct).to be_within(0.01).of(-50.0)
      expect(hr.total_return_usd_pct).to be_within(0.01).of(40.0)

      identity = (1 + hr.capital_return_pct / 100.0) * (1 + hr.currency_return_pct / 100.0) - 1
      expect(identity * 100).to be_within(0.01).of(hr.total_return_usd_pct)
    end

    it "us_stock has zero currency return" do
      # Bought at 100 USD, now at 120 USD → 20% capital, 0% currency, 20% total
      h = holding(ticker: "AAPL", type: :us_stock, shares: 10, avg_price: 100.0)
      prices = { "AAPL" => { last: 120.0, change: 0.5 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.capital_return_pct).to be_within(0.01).of(20.0)
      expect(hr.currency_return_pct).to eq(0.0)
      expect(hr.total_return_usd_pct).to be_within(0.01).of(20.0)
    end

    it "returns nil decomposition when purchase_fx_rate is nil" do
      h = holding(ticker: "AAPL", type: :cedear, shares: 50, avg_price: 14000.0)
      prices = { "AAPL" => { last: 15200.0, change: 0.8 } }

      result = Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      hr = result.holdings.first
      expect(hr.capital_return_pct).to be_within(0.01).of(8.57)
      expect(hr.currency_return_pct).to be_nil
      expect(hr.total_return_usd_pct).to be_nil
    end
  end

  describe "edge cases" do
    it "returns zero totals for empty holdings" do
      result = Argpt::Portfolio::Calculator.new(holdings: [], prices: {}, mep_rate: mep_rate, ccl_rate: ccl_rate).call

      expect(result.total_value_usd).to eq(0)
      expect(result.total_value_ars).to eq(0)
      expect(result.total_pnl_usd).to eq(0)
      expect(result.total_pnl_ars).to eq(0)
      expect(result.daily_change_pct).to eq(0)
      expect(result.holdings).to be_empty
    end

    it "raises when ticker is missing from prices" do
      h = holding(ticker: "MISSING", type: :arg_stock, shares: 100, avg_price: 4800.0)

      expect {
        Argpt::Portfolio::Calculator.new(holdings: [h], prices: {}, mep_rate: mep_rate, ccl_rate: ccl_rate).call
      }.to raise_error(Argpt::Error, /missing price.*MISSING/i)
    end

    it "raises when price has nil :last" do
      h = holding(ticker: "GGAL", type: :arg_stock, shares: 100, avg_price: 4800.0)
      prices = { "GGAL" => { last: nil, change: 0.5 } }

      expect {
        Argpt::Portfolio::Calculator.new(holdings: [h], prices:, mep_rate: mep_rate, ccl_rate: ccl_rate).call
      }.to raise_error(Argpt::Error, /missing :last/i)
    end
  end
end
