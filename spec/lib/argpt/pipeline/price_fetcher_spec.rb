require "spec_helper"

RSpec.describe Argpt::Pipeline::PriceFetcher do
  describe "#call" do
    it "fetches arg_stock prices from Data912" do
      data912 = stub_data912(arg_stocks: [{ ticker: "GGAL", last: 5200.0, change: 2.5, volume: 1500000 }])
      entries = [{ ticker: "GGAL", type: :arg_stock }]

      result = Argpt::Pipeline::PriceFetcher.new(data912:, entries:).call

      expect(result["GGAL:arg_stock"]).to eq({ last: 5200.0, change: 2.5, volume: 1500000, currency: :ars, type: :arg_stock })
    end

    it "fetches cedear prices from Data912" do
      data912 = stub_data912(arg_cedears: [{ ticker: "AAPL", last: 15200.0, change: 0.8, volume: 500000 }])
      entries = [{ ticker: "AAPL", type: :cedear }]

      result = Argpt::Pipeline::PriceFetcher.new(data912:, entries:).call

      expect(result["AAPL:cedear"]).to eq({ last: 15200.0, change: 0.8, volume: 500000, currency: :ars, type: :cedear })
    end

    it "fetches us_stock prices from Data912" do
      data912 = stub_data912(usa_stocks: [{ ticker: "AAPL", last: 185.5, change: 1.2, volume: 45000000 }])
      entries = [{ ticker: "AAPL", type: :us_stock }]

      result = Argpt::Pipeline::PriceFetcher.new(data912:, entries:).call

      expect(result["AAPL:us_stock"]).to eq({ last: 185.5, change: 1.2, volume: 45000000, currency: :usd, type: :us_stock })
    end

    it "filters to only requested tickers" do
      data912 = stub_data912(arg_stocks: [
        { ticker: "GGAL", last: 5200.0, change: 2.5, volume: 1500000 },
        { ticker: "YPF", last: 38000.0, change: -1.2, volume: 800000 }
      ])
      entries = [{ ticker: "GGAL", type: :arg_stock }]

      result = Argpt::Pipeline::PriceFetcher.new(data912:, entries:).call

      expect(result.keys).to eq(["GGAL:arg_stock"])
    end

    it "handles mixed asset types" do
      data912 = stub_data912(
        arg_stocks: [{ ticker: "GGAL", last: 5200.0, change: 2.5, volume: 1500000 }],
        usa_stocks: [{ ticker: "AAPL", last: 185.5, change: 1.2, volume: 45000000 }]
      )
      entries = [
        { ticker: "GGAL", type: :arg_stock },
        { ticker: "AAPL", type: :us_stock }
      ]

      result = Argpt::Pipeline::PriceFetcher.new(data912:, entries:).call

      expect(result.keys).to contain_exactly("GGAL:arg_stock", "AAPL:us_stock")
    end
  end

  private

  def stub_data912(arg_stocks: [], arg_cedears: [], usa_stocks: [])
    data912 = Argpt::DataSources::Data912.new(client: Argpt::HttpClient.new)
    allow(data912).to receive(:arg_stocks).and_return(arg_stocks)
    allow(data912).to receive(:arg_cedears).and_return(arg_cedears)
    allow(data912).to receive(:usa_stocks).and_return(usa_stocks)
    data912
  end
end
