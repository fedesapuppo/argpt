require "spec_helper"
require "tmpdir"

RSpec.describe Argpt::Pipeline::Writer do
  describe "#call" do
    it "writes exchange_rates.json" do
      dir = Dir.mktmpdir
      rates = { mep: { ticker: "AL30", bid: 1175.0, ask: 1180.0, mark: 1177.5 },
                ccl: { ticker: "AL30", bid: 1205.0, ask: 1210.0, mark: 1207.5 } }

      Argpt::Pipeline::Writer.new(output_dir: dir).call(exchange_rates: rates, prices: {}, technicals: {}, fundamentals: {})

      data = JSON.parse(File.read(File.join(dir, "exchange_rates.json")), symbolize_names: true)
      expect(data[:mep][:mark]).to eq(1177.5)
      expect(data[:ccl][:ticker]).to eq("AL30")
      expect(data[:fetched_at]).not_to be_nil
    ensure
      FileUtils.rm_rf(dir)
    end

    it "writes prices.json" do
      dir = Dir.mktmpdir
      prices = { "GGAL:arg_stock" => { last: 5200.0, change: 2.5, volume: 1500000 } }

      Argpt::Pipeline::Writer.new(output_dir: dir).call(exchange_rates: {}, prices:, technicals: {}, fundamentals: {})

      data = JSON.parse(File.read(File.join(dir, "prices.json")), symbolize_names: true)
      expect(data[:"GGAL:arg_stock"][:last]).to eq(5200.0)
    ensure
      FileUtils.rm_rf(dir)
    end

    it "writes technicals.json" do
      dir = Dir.mktmpdir
      technicals = { "AAPL" => { rsi14: 38.91 } }

      Argpt::Pipeline::Writer.new(output_dir: dir).call(exchange_rates: {}, prices: {}, technicals:, fundamentals: {})

      data = JSON.parse(File.read(File.join(dir, "technicals.json")), symbolize_names: true)
      expect(data[:AAPL][:rsi14]).to eq(38.91)
    ensure
      FileUtils.rm_rf(dir)
    end

    it "writes fundamentals.json" do
      dir = Dir.mktmpdir
      fundamentals = { "AAPL" => { pe: 31.75, sector: "Technology" } }

      Argpt::Pipeline::Writer.new(output_dir: dir).call(exchange_rates: {}, prices: {}, technicals: {}, fundamentals:)

      data = JSON.parse(File.read(File.join(dir, "fundamentals.json")), symbolize_names: true)
      expect(data[:AAPL][:pe]).to eq(31.75)
    ensure
      FileUtils.rm_rf(dir)
    end

    it "creates the output directory if missing" do
      dir = File.join(Dir.mktmpdir, "nested", "data")

      Argpt::Pipeline::Writer.new(output_dir: dir).call(exchange_rates: {}, prices: {}, technicals: {}, fundamentals: {})

      expect(File.exist?(File.join(dir, "exchange_rates.json"))).to be true
    ensure
      FileUtils.rm_rf(dir)
    end
  end
end
