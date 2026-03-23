require "spec_helper"

RSpec.describe Argpt::Import::Balanz do
  def fixture_path
    File.join(File.dirname(__FILE__), "../../../fixtures/balanz_sample.xlsx")
  end

  describe "#call" do
    it "returns aggregated holdings" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call

      expect(result.length).to eq(3)
    end

    it "aggregates AAPL cedear lots" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      aapl = result.find { |h| h.ticker == "AAPL" }

      expect(aapl.type).to eq(:cedear)
      expect(aapl.shares).to eq(30)
    end

    it "computes weighted average price excluding zero-cost lots" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      aapl = result.find { |h| h.ticker == "AAPL" }

      expected_avg = (20 * 12025.0 + 10 * 12000.0) / 30
      expect(aapl.avg_price).to be_within(0.01).of(expected_avg)
    end

    it "computes weighted average MEP from paid lots" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      aapl = result.find { |h| h.ticker == "AAPL" }

      expected_mep = (20 * 1181.59 + 10 * 1208.3) / 30
      expect(aapl.purchase_fx_rate).to be_within(0.01).of(expected_mep)
    end

    it "includes zero-cost split shares in total but not in avg price" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      adbe = result.find { |h| h.ticker == "ADBE" }

      expect(adbe.shares).to eq(3)
      expect(adbe.avg_price).to eq(7393.0)
      expect(adbe.purchase_fx_rate).to be_within(0.01).of(148.58)
    end

    it "aggregates GGAL as arg_stock" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      ggal = result.find { |h| h.ticker == "GGAL" }

      expect(ggal.type).to eq(:arg_stock)
      expect(ggal.shares).to eq(150)

      expected_avg = (100 * 194.0 + 50 * 1836.0) / 150
      expect(ggal.avg_price).to be_within(0.01).of(expected_avg)
    end

    it "skips bonds" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call

      expect(result.none? { |h| h.ticker == "GD30" }).to be true
    end

    it "skips fondos" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call

      expect(result.none? { |h| h.ticker == "BCACCA" }).to be true
    end

    it "sets purchase_date from earliest paid lot" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      aapl = result.find { |h| h.ticker == "AAPL" }

      expect(aapl.purchase_date).to eq(Date.new(2025, 6, 24))
    end
  end
end
