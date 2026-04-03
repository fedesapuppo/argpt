require "spec_helper"

RSpec.describe Argpt::Portfolio::ExchangeRate do
  def rates_with_al30
    [
      { ticker: "GD30", buy: 1180.50, sell: 1185.00, rate: 1182.75 },
      { ticker: "AL30", buy: 1175.00, sell: 1180.00, rate: 1177.50 }
    ]
  end

  def rates_without_al30
    [
      { ticker: "GD30", buy: 1180.50, sell: 1185.00, rate: 1182.75 }
    ]
  end

  describe ".best" do
    it "prefers AL30 when present" do
      rate = Argpt::Portfolio::ExchangeRate.best(rates_with_al30)

      expect(rate.ticker).to eq("AL30")
    end

    it "falls back to first entry when AL30 is absent" do
      rate = Argpt::Portfolio::ExchangeRate.best(rates_without_al30)

      expect(rate.ticker).to eq("GD30")
    end

    it "maps buy/sell/rate keys correctly" do
      rate = Argpt::Portfolio::ExchangeRate.best(rates_with_al30)

      expect(rate.bid).to eq(1175.00)
      expect(rate.ask).to eq(1180.00)
      expect(rate.mark).to eq(1177.50)
    end

    it "maps bid/ask/mark keys correctly" do
      data = [{ ticker: "AL30", bid: 1175.00, ask: 1180.00, mark: 1177.50 }]

      rate = Argpt::Portfolio::ExchangeRate.best(data)

      expect(rate.bid).to eq(1175.00)
      expect(rate.ask).to eq(1180.00)
      expect(rate.mark).to eq(1177.50)
    end

    it "raises on empty data" do
      expect { Argpt::Portfolio::ExchangeRate.best([]) }
        .to raise_error(Argpt::Error, /no rate data/i)
    end
  end

  describe "Rate" do
    it "exposes all fields" do
      rate = Argpt::Portfolio::ExchangeRate::Rate.new(
        ticker: "AL30", bid: 1175.0, ask: 1180.0, mark: 1177.5
      )

      expect(rate.ticker).to eq("AL30")
      expect(rate.bid).to eq(1175.0)
      expect(rate.ask).to eq(1180.0)
      expect(rate.mark).to eq(1177.5)
    end
  end
end
