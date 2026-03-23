require "spec_helper"

RSpec.describe Argpt::DataSources::ArgentinaDatos do
  def stub_mep_history(fixture = "argdatos_mep_history.json")
    stub_request(:get, "https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa")
      .to_return(body: load_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  def stub_ccl_history(fixture = "argdatos_ccl_history.json")
    stub_request(:get, "https://api.argentinadatos.com/v1/cotizaciones/dolares/contadoconliqui")
      .to_return(body: load_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  def build_source
    Argpt::DataSources::ArgentinaDatos.new(client: Argpt::HttpClient.new(delay: 0))
  end

  describe "#mep_history" do
    it "returns parsed array of rates" do
      stub_mep_history
      source = build_source

      result = source.mep_history

      expect(result).to be_an(Array)
      expect(result.first[:fecha]).to eq("2019-01-02")
      expect(result.first[:compra]).to eq(36.0)
    end
  end

  describe "#mep_on" do
    it "returns rate for exact date match" do
      stub_mep_history
      source = build_source

      rate = source.mep_on(Date.new(2026, 3, 20))

      expect(rate).to be_a(Argpt::DataSources::ArgentinaDatos::FxRate)
      expect(rate.date).to eq(Date.new(2026, 3, 20))
      expect(rate.buy).to eq(1178.0)
      expect(rate.sell).to eq(1183.0)
      expect(rate.mark).to eq(1180.5)
    end

    it "falls back to previous trading day for missing date" do
      stub_mep_history
      source = build_source

      rate = source.mep_on(Date.new(2026, 3, 22))

      expect(rate.date).to eq(Date.new(2026, 3, 21))
    end

    it "raises for date before history starts" do
      stub_mep_history
      source = build_source

      expect { source.mep_on(Date.new(2018, 1, 1)) }
        .to raise_error(Argpt::Error, /no MEP data/i)
    end
  end

  describe "#ccl_history" do
    it "returns parsed array of rates" do
      stub_ccl_history
      source = build_source

      result = source.ccl_history

      expect(result).to be_an(Array)
      expect(result.first[:casa]).to eq("contadoconliqui")
      expect(result.first[:compra]).to eq(40.0)
    end
  end

  describe "#ccl_on" do
    it "returns rate for exact date match" do
      stub_ccl_history
      source = build_source

      rate = source.ccl_on(Date.new(2026, 3, 20))

      expect(rate).to be_a(Argpt::DataSources::ArgentinaDatos::FxRate)
      expect(rate.date).to eq(Date.new(2026, 3, 20))
      expect(rate.buy).to eq(1208.0)
      expect(rate.sell).to eq(1213.0)
      expect(rate.mark).to eq(1210.5)
    end

    it "falls back to previous trading day for missing date" do
      stub_ccl_history
      source = build_source

      rate = source.ccl_on(Date.new(2026, 3, 22))

      expect(rate.date).to eq(Date.new(2026, 3, 21))
    end

    it "raises for date before history starts" do
      stub_ccl_history
      source = build_source

      expect { source.ccl_on(Date.new(2018, 1, 1)) }
        .to raise_error(Argpt::Error, /no CCL data/i)
    end
  end

  describe "error propagation" do
    it "raises HttpError on 4xx response" do
      stub_request(:get, "https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa")
        .to_return(status: 404, body: "Not Found")
      source = build_source

      expect { source.mep_history }.to raise_error(Argpt::HttpError)
    end

    it "raises ServerError on 5xx response" do
      stub_request(:get, "https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa")
        .to_return(status: 500)
      source = build_source

      expect { source.mep_history }.to raise_error(Argpt::ServerError)
    end
  end
end
