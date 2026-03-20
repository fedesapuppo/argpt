require "spec_helper"

RSpec.describe Argpt::DataSources::Data912 do
  def stub_data912(path, fixture)
    stub_request(:get, "https://data912.com#{path}")
      .to_return(body: load_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  describe "#mep_rates" do
    it "returns MEP rate data" do
      stub_data912("/live/mep", "data912_mep.json")
      source = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.mep_rates

      expect(result).to be_an(Array)
      expect(result.first[:ticker]).to eq("GD30")
      expect(result.first[:rate]).to eq(1182.75)
    end
  end

  describe "#ccl_rates" do
    it "returns CCL rate data" do
      stub_data912("/live/ccl", "data912_ccl.json")
      source = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.ccl_rates

      expect(result).to be_an(Array)
      expect(result.first[:ticker]).to eq("GD30")
      expect(result.first[:rate]).to eq(1212.50)
    end
  end

  describe "#arg_stocks" do
    it "returns Argentine stock data" do
      stub_data912("/live/arg_stocks", "data912_arg_stocks.json")
      source = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.arg_stocks

      expect(result.length).to eq(2)
      expect(result.first[:ticker]).to eq("GGAL")
    end
  end

  describe "#arg_cedears" do
    it "returns CEDEAR data" do
      stub_data912("/live/arg_cedears", "data912_arg_cedears.json")
      source = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.arg_cedears

      expect(result.length).to eq(2)
      expect(result.first[:ticker]).to eq("AAPL")
    end
  end

  describe "#usa_stocks" do
    it "returns US stock data" do
      stub_data912("/live/usa_stocks", "data912_usa_stocks.json")
      source = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.usa_stocks

      expect(result.length).to eq(2)
      expect(result.first[:ticker]).to eq("AAPL")
      expect(result.first[:last]).to eq(185.50)
    end
  end

  describe "error propagation" do
    it "raises HttpError on 4xx response" do
      stub_request(:get, "https://data912.com/live/mep")
        .to_return(status: 404, body: "Not Found")

      source = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))

      expect { source.mep_rates }.to raise_error(Argpt::HttpError)
    end

    it "raises ServerError on 5xx response" do
      stub_request(:get, "https://data912.com/live/mep")
        .to_return(status: 500)

      source = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0, max_retries: 1))

      expect { source.mep_rates }.to raise_error(Argpt::ServerError)
    end
  end

  describe "#historical" do
    it "returns historical data for a ticker" do
      stub_data912("/historical/stocks/GGAL", "data912_historical_stocks_ggal.json")
      source = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.historical("stocks", "GGAL")

      expect(result).to be_an(Array)
      expect(result.first[:date]).to eq("2026-03-18")
      expect(result.first[:close]).to eq(5200.00)
    end
  end
end
