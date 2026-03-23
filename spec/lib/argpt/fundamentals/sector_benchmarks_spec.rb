require "spec_helper"

RSpec.describe Argpt::Fundamentals::SectorBenchmarks do
  describe ".for" do
    it "returns benchmarks for Technology sector" do
      result = Argpt::Fundamentals::SectorBenchmarks.for("Technology")

      expect(result[:pe]).to be_a(Numeric)
      expect(result[:roe]).to be_a(Numeric)
      expect(result[:debt_to_equity]).to be_a(Numeric)
      expect(result[:profit_margin]).to be_a(Numeric)
    end

    it "returns benchmarks for Financial Services sector" do
      result = Argpt::Fundamentals::SectorBenchmarks.for("Financial Services")

      expect(result[:pe]).to be < 20
    end

    it "returns nil for unknown sector" do
      result = Argpt::Fundamentals::SectorBenchmarks.for("Alien Technology")

      expect(result).to be_nil
    end

    it "covers all 11 GICS sectors" do
      sectors = %w[Technology Financial\ Services Healthcare Energy
                   Consumer\ Cyclical Consumer\ Defensive Industrials
                   Basic\ Materials Real\ Estate Utilities Communication\ Services]

      sectors.each do |sector|
        expect(Argpt::Fundamentals::SectorBenchmarks.for(sector)).not_to be_nil, "Missing benchmarks for #{sector}"
      end
    end
  end
end
