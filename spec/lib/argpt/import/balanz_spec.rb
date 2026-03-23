require "spec_helper"

RSpec.describe Argpt::Import::Balanz do
  def fixture_path
    File.join(File.dirname(__FILE__), "../../../fixtures/balanz_sample.xlsx")
  end

  describe "#call" do
    it "returns per-lot holdings" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call

      tickers = result.map(&:ticker)
      expect(tickers.count("AAPL")).to eq(2)
      expect(tickers.count("GGAL")).to eq(2)
    end

    it "preserves per-lot MEP rate" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      aapl_lots = result.select { |h| h.ticker == "AAPL" }

      mep_rates = aapl_lots.map(&:purchase_fx_rate).sort
      expect(mep_rates).to eq([1181.59, 1208.3])
    end

    it "preserves per-lot price" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      aapl_lots = result.select { |h| h.ticker == "AAPL" }

      prices = aapl_lots.map(&:avg_price).sort
      expect(prices).to eq([12000.0, 12025.0])
    end

    it "distributes zero-cost split shares across paid lots" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      adbe = result.find { |h| h.ticker == "ADBE" }

      expect(adbe.shares).to eq(3)
      expect(adbe.avg_price).to eq(7393.0)
      expect(adbe.purchase_fx_rate).to be_within(0.01).of(148.58)
    end

    it "maps Acciones to arg_stock" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      ggal = result.find { |h| h.ticker == "GGAL" }

      expect(ggal.type).to eq(:arg_stock)
    end

    it "skips bonds" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call

      expect(result.none? { |h| h.ticker == "GD30" }).to be true
    end

    it "skips fondos" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call

      expect(result.none? { |h| h.ticker == "BCACCA" }).to be true
    end

    it "sets purchase_date per lot" do
      result = Argpt::Import::Balanz.new(path: fixture_path).call
      ggal_lots = result.select { |h| h.ticker == "GGAL" }.sort_by(&:purchase_date)

      expect(ggal_lots.first.purchase_date).to eq(Date.new(2021, 9, 15))
      expect(ggal_lots.last.purchase_date).to eq(Date.new(2024, 1, 10))
    end
  end
end
