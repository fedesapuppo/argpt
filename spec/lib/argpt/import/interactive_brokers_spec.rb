require "spec_helper"

RSpec.describe Argpt::Import::InteractiveBrokers do
  def fixture_path
    File.join(File.dirname(__FILE__), "../../../fixtures/ib_sample.csv")
  end

  describe "#call" do
    it "returns holdings from Open Positions section" do
      result = Argpt::Import::InteractiveBrokers.new(path: fixture_path).call

      expect(result.length).to eq(3)
      expect(result.map(&:ticker)).to contain_exactly("AAPL", "QQQ", "TSLA")
    end

    it "parses shares including fractional" do
      result = Argpt::Import::InteractiveBrokers.new(path: fixture_path).call

      qqq = result.find { |h| h.ticker == "QQQ" }
      expect(qqq.shares).to eq(40.4754)
    end

    it "parses cost price as avg_price" do
      result = Argpt::Import::InteractiveBrokers.new(path: fixture_path).call

      aapl = result.find { |h| h.ticker == "AAPL" }
      expect(aapl.avg_price).to be_within(0.01).of(170.50)
    end

    it "sets type to us_stock" do
      result = Argpt::Import::InteractiveBrokers.new(path: fixture_path).call

      expect(result.all? { |h| h.type == :us_stock }).to be true
    end

    it "sets broker to :ib" do
      result = Argpt::Import::InteractiveBrokers.new(path: fixture_path).call

      expect(result.all? { |h| h.broker == :ib }).to be true
    end

    it "skips Total rows" do
      result = Argpt::Import::InteractiveBrokers.new(path: fixture_path).call

      expect(result.length).to eq(3)
    end

    it "does not set purchase_fx_rate" do
      result = Argpt::Import::InteractiveBrokers.new(path: fixture_path).call

      expect(result.all? { |h| h.purchase_fx_rate.nil? }).to be true
    end
  end
end
