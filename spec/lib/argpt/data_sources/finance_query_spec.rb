require "spec_helper"

RSpec.describe Argpt::DataSources::FinanceQuery do
  def stub_fq_get(path, fixture, params: {})
    stub_request(:get, "https://finance-query.com#{path}")
      .with(query: params)
      .to_return(body: load_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  def stub_fq_graphql(fixture)
    stub_request(:post, "https://finance-query.com/graphql")
      .to_return(body: load_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  describe "#quotes" do
    it "returns quote data for symbols" do
      stub_fq_get("/v2/quotes", "fq_quotes_aapl.json", params: { symbols: "AAPL" })
      source = Argpt::DataSources::FinanceQuery.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.quotes(["AAPL"])

      expect(result).to be_an(Array)
      expect(result.first[:symbol]).to eq("AAPL")
      expect(result.first[:regularMarketPrice]).to eq(185.50)
    end

    it "joins multiple symbols with commas" do
      stub_fq_get("/v2/quotes", "fq_quotes_aapl.json", params: { symbols: "AAPL,MSFT" })
      source = Argpt::DataSources::FinanceQuery.new(client: Argpt::HttpClient.new(delay: 0))

      source.quotes(["AAPL", "MSFT"])

      expect(a_request(:get, "https://finance-query.com/v2/quotes")
        .with(query: { symbols: "AAPL,MSFT" })).to have_been_made
    end
  end

  describe "#indicators" do
    it "returns technical indicators" do
      stub_fq_graphql("fq_indicators_aapl.json")
      source = Argpt::DataSources::FinanceQuery.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.indicators("AAPL", interval: "1d", range: "3mo")

      expect(result[:indicators][:rsi]).to eq(55.2)
    end
  end

  describe "#financials" do
    it "returns financial statements" do
      stub_fq_graphql("fq_financials_aapl.json")
      source = Argpt::DataSources::FinanceQuery.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.financials("AAPL", statement: "income", frequency: "annual")

      expect(result[:financials][:revenue]).to eq(394328000000)
    end
  end

  describe "#risk" do
    it "returns risk metrics" do
      stub_fq_graphql("fq_risk_aapl.json")
      source = Argpt::DataSources::FinanceQuery.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.risk("AAPL", interval: "1d", range: "1y")

      expect(result[:risk][:beta]).to eq(1.25)
    end
  end

  describe "#chart" do
    it "returns chart data" do
      stub_fq_graphql("fq_chart_aapl.json")
      source = Argpt::DataSources::FinanceQuery.new(client: Argpt::HttpClient.new(delay: 0))

      result = source.chart("AAPL", interval: "1d", range: "3mo")

      expect(result[:chart]).to be_an(Array)
      expect(result[:chart].first[:close]).to eq(185.50)
    end
  end

  describe "GraphQL error handling" do
    it "raises GraphqlError when response contains errors" do
      stub_fq_graphql("fq_graphql_error.json")
      source = Argpt::DataSources::FinanceQuery.new(client: Argpt::HttpClient.new(delay: 0))

      expect { source.indicators("INVALID", interval: "1d", range: "3mo") }
        .to raise_error(Argpt::GraphqlError, "Symbol not found: INVALID")
    end
  end
end
