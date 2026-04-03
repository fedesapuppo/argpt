require "spec_helper"
require "tmpdir"
require "tempfile"

RSpec.describe Argpt::Pipeline::Fetch do
  describe "#call" do
    it "writes all four JSON files" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query

      Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      %w[exchange_rates prices technicals fundamentals].each do |name|
        expect(File.exist?(File.join(output_dir, "#{name}.json"))).to be(true)
      end
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "writes correct exchange rates" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query

      Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      data = parse_json(output_dir, "exchange_rates.json")
      expect(data[:mep][:mark]).to eq(1177.5)
      expect(data[:ccl][:mark]).to eq(1207.5)
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "writes prices with composite keys" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query

      Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      data = parse_json(output_dir, "prices.json")
      expect(data[:"AAPL:us_stock"][:last]).to eq(185.5)
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "writes technicals per ticker" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query

      Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      data = parse_json(output_dir, "technicals.json")
      expect(data[:AAPL][:rsi14]).to eq(38.91)
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "writes fundamentals per ticker" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query

      Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      data = parse_json(output_dir, "fundamentals.json")
      expect(data[:AAPL][:pe]).not_to be_nil
      expect(data[:AAPL][:sector]).to eq("Technology")
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "populates pct_below_ath for US stocks from fifty_two_week_high" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query

      Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      data = parse_json(output_dir, "technicals.json")
      expected = (288.62 - 251.12) / 288.62 * 100
      expect(data[:AAPL][:pct_below_ath]).to be_within(0.01).of(expected)
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "returns a summary hash" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query

      result = Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      expect(result[:tickers_count]).to eq(1)
      expect(result[:output_dir]).to eq(output_dir)
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "tracks skipped fundamentals in result" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query
      allow(finance_query).to receive(:quote).and_raise(Argpt::GraphqlError, "query failed")

      result = Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      expect(result[:skipped]).to include(
        hash_including(ticker: "AAPL", section: :fundamentals)
      )
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "tracks skipped technicals in result" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query
      allow(finance_query).to receive(:indicators).and_raise(Argpt::HttpError, "timeout")

      result = Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      expect(result[:skipped]).to include(
        hash_including(ticker: "AAPL", section: :technicals)
      )
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end

    it "returns empty skipped array when nothing is skipped" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: AAPL\n    type: us_stock\n")
      data912 = stub_data912
      finance_query = stub_finance_query

      result = Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      expect(result[:skipped]).to eq([])
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end
  end

  describe "#fq_symbol via TICKER_ALIASES" do
    it "resolves BRKB to BRK-B for finance-query" do
      output_dir = Dir.mktmpdir
      config_file = write_config("tickers:\n  - ticker: BRKB\n    type: cedear\n")
      data912 = stub_data912
      finance_query = stub_finance_query
      allow(finance_query).to receive(:quotes).and_return({ quotes: {} })

      Argpt::Pipeline::Fetch.new(
        config_path: config_file.path,
        output_dir:,
        data912:,
        finance_query:
      ).call

      expect(finance_query).to have_received(:quote).with("BRK-B")
    ensure
      FileUtils.rm_rf(output_dir)
      config_file.close!
    end
  end

  private

  def write_config(yaml_content)
    file = Tempfile.new(["holdings", ".yml"])
    file.write(yaml_content)
    file.rewind
    file
  end

  def parse_json(dir, filename)
    JSON.parse(File.read(File.join(dir, filename)), symbolize_names: true)
  end

  def stub_data912
    client = Argpt::HttpClient.new
    data912 = Argpt::DataSources::Data912.new(client:)
    allow(data912).to receive(:mep_rates).and_return([
      { ticker: "AL30", buy: 1175.0, sell: 1180.0, rate: 1177.5 }
    ])
    allow(data912).to receive(:ccl_rates).and_return([
      { ticker: "AL30", buy: 1205.0, sell: 1210.0, rate: 1207.5 }
    ])
    allow(data912).to receive(:arg_stocks).and_return([])
    allow(data912).to receive(:arg_cedears).and_return([])
    allow(data912).to receive(:usa_stocks).and_return([
      { ticker: "AAPL", last: 185.5, change: 1.2, volume: 45000000 }
    ])
    allow(data912).to receive(:historical).and_return([
      { date: "2026-03-18", open: 180.0, high: 190.0, low: 178.0, close: 185.5, volume: 45000000 }
    ])
    data912
  end

  def stub_finance_query
    client = Argpt::HttpClient.new
    fq = Argpt::DataSources::FinanceQuery.new(client:)
    allow(fq).to receive(:indicators).and_return(
      indicators: {
        rsi14: 38.91,
        macd: { histogram: -2.15, macd: -5.83, signal: -3.68 },
        stochastic: { "%K": 24.56, "%D": 31.12 },
        sma20: 255.30, sma50: 240.15, sma200: 228.70,
        bollingerBands: { lower: 238.50, middle: 255.30, upper: 272.10 },
        supertrend: { trend: "down", value: 263.44 },
        atr14: 5.57
      }
    )
    allow(fq).to receive(:quote).and_return(
      regularMarketPrice: 251.12, trailingEps: 7.91, forwardEps: 9.32,
      priceToBook: 41.87, returnOnEquity: 1.5202, profitMargins: 0.2704,
      operatingMargins: 0.3537, debtToEquity: 102.63, dividendYield: 0.0042,
      earningsGrowth: 0.104, fiftyTwoWeekHigh: 288.62, fiftyTwoWeekLow: 169.21,
      sector: "Technology", industry: "Consumer Electronics",
      shortName: "Apple Inc.", marketCap: 3_800_000_000_000
    )
    fq
  end
end
