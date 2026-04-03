require "spec_helper"

RSpec.describe Argpt::Import::SpinoffPricer do
  def build_holding(ticker:, type: :arg_stock, shares: 5, avg_price: 0.01, purchase_date: nil, purchase_fx_rate: nil)
    Argpt::Portfolio::Holding.new(
      ticker:, type:, shares:, avg_price:, purchase_date:, purchase_fx_rate:, broker: :balanz
    )
  end

  def stub_historical(ticker, fixture_data)
    stub_request(:get, "https://data912.com/historical/stocks/#{ticker}")
      .to_return(body: fixture_data.to_json, headers: { "Content-Type" => "application/json" })
  end

  describe "#call" do
    it "resolves closing price for spinoff lots" do
      holding = build_holding(ticker: "IRSA", purchase_date: Date.new(2025, 11, 7), purchase_fx_rate: 1452.57)
      stub_historical("IRSA", [
        { date: "2025-11-07", open: 2100, high: 2200, low: 2050, close: 2150, volume: 500_000 },
        { date: "2025-11-06", open: 2000, high: 2100, low: 1950, close: 2080, volume: 400_000 }
      ])

      data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))
      result = Argpt::Import::SpinoffPricer.new(holdings: [holding], data912:).call

      expect(result.length).to eq(1)
      expect(result.first.avg_price).to eq(2150.0)
      expect(result.first.purchase_date).to eq(Date.new(2025, 11, 7))
      expect(result.first.purchase_fx_rate).to eq(1452.57)
    end

    it "leaves non-spinoff holdings unchanged" do
      regular = build_holding(ticker: "GGAL", avg_price: 1836.0, purchase_date: Date.new(2024, 1, 10), purchase_fx_rate: 1088.0)

      data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))
      result = Argpt::Import::SpinoffPricer.new(holdings: [regular], data912:).call

      expect(result.first).to eq(regular)
    end

    it "leaves spinoff holdings without purchase_date unchanged" do
      holding = build_holding(ticker: "IRSA", purchase_date: nil)

      data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))
      result = Argpt::Import::SpinoffPricer.new(holdings: [holding], data912:).call

      expect(result.first.avg_price).to eq(0.01)
    end

    it "falls back to nearest earlier date when exact date not found" do
      holding = build_holding(ticker: "IRSA", purchase_date: Date.new(2025, 11, 7), purchase_fx_rate: 1452.57)
      stub_historical("IRSA", [
        { date: "2025-11-06", open: 2000, high: 2100, low: 1950, close: 2080, volume: 400_000 },
        { date: "2025-11-05", open: 1900, high: 2000, low: 1850, close: 1950, volume: 300_000 }
      ])

      data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))
      result = Argpt::Import::SpinoffPricer.new(holdings: [holding], data912:).call

      expect(result.first.avg_price).to eq(2080.0)
    end

    it "leaves holding unchanged when API fails" do
      holding = build_holding(ticker: "IRSA", purchase_date: Date.new(2025, 11, 7), purchase_fx_rate: 1452.57)
      stub_request(:get, "https://data912.com/historical/stocks/IRSA")
        .to_return(status: 500)

      data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0, max_retries: 1))
      result = Argpt::Import::SpinoffPricer.new(holdings: [holding], data912:).call

      expect(result.first.avg_price).to eq(0.01)
    end

    it "handles abbreviated key format from API" do
      holding = build_holding(ticker: "IRSA", purchase_date: Date.new(2025, 11, 7), purchase_fx_rate: 1452.57)
      stub_historical("IRSA", [
        { date: "2025-11-07", o: 2055, h: 2155, l: 2015, c: 2060, v: 635_122 }
      ])

      data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))
      result = Argpt::Import::SpinoffPricer.new(holdings: [holding], data912:).call

      expect(result.first.avg_price).to eq(2060)
    end

    it "leaves holding unchanged when API returns error hash" do
      holding = build_holding(ticker: "ECOG", purchase_date: Date.new(2025, 10, 1), purchase_fx_rate: 1531.01)
      stub_historical("ECOG", { Error: "Nahh no tengo ese ticker loko" })

      data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))
      result = Argpt::Import::SpinoffPricer.new(holdings: [holding], data912:).call

      expect(result.first.avg_price).to eq(0.01)
    end

    it "fetches historical for cedears using cedears type" do
      holding = build_holding(ticker: "ADBE", type: :cedear, purchase_date: Date.new(2025, 11, 7), purchase_fx_rate: 1200.0)
      stub_request(:get, "https://data912.com/historical/cedears/ADBE")
        .to_return(body: [{ date: "2025-11-07", open: 7000, high: 7200, low: 6900, close: 7100, volume: 100_000 }].to_json,
                   headers: { "Content-Type" => "application/json" })

      data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))
      result = Argpt::Import::SpinoffPricer.new(holdings: [holding], data912:).call

      expect(result.first.avg_price).to eq(7100.0)
    end
  end
end
