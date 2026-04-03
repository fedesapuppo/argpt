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

    context "when shares column contains non-numeric value" do
      it "raises an error" do
        csv = csv_with_bad_field(quantity: "N/A")

        expect { Argpt::Import::InteractiveBrokers.new(path: csv.path).call }
          .to raise_error(Argpt::Error, /non-numeric.*shares/i)
      end
    end

    context "when cost price column contains non-numeric value" do
      it "raises an error" do
        csv = csv_with_bad_field(cost_price: "ERR")

        expect { Argpt::Import::InteractiveBrokers.new(path: csv.path).call }
          .to raise_error(Argpt::Error, /non-numeric.*cost price/i)
      end
    end
  end

  private

  def csv_with_bad_field(quantity: "10", cost_price: "170.50")
    file = Tempfile.new(["ib_bad", ".csv"])
    file.write("Open Positions,Data,Summary,Stocks,USD,AAPL,#{quantity},1,#{cost_price},1705.00,185.25,1852.50,147.50,\n")
    file.rewind
    file
  end
end
