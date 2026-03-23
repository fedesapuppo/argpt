require "spec_helper"

RSpec.describe Argpt::Portfolio::Holding do
  describe "creation" do
    it "stores all attributes" do
      holding = Argpt::Portfolio::Holding.new(
        ticker: "GGAL", type: :arg_stock, shares: 100,
        avg_price: 4800.0, purchase_date: Date.new(2025, 6, 15),
        purchase_fx_rate: 1100.0
      )

      expect(holding.ticker).to eq("GGAL")
      expect(holding.type).to eq(:arg_stock)
      expect(holding.shares).to eq(100)
      expect(holding.avg_price).to eq(4800.0)
      expect(holding.purchase_date).to eq(Date.new(2025, 6, 15))
      expect(holding.purchase_fx_rate).to eq(1100.0)
    end

    it "is frozen after creation" do
      holding = Argpt::Portfolio::Holding.new(
        ticker: "GGAL", type: :arg_stock, shares: 100,
        avg_price: 4800.0, purchase_date: Date.new(2025, 6, 15)
      )

      expect(holding).to be_frozen
    end

    it "allows nil purchase_fx_rate" do
      holding = Argpt::Portfolio::Holding.new(
        ticker: "AAPL", type: :us_stock, shares: 10,
        avg_price: 170.0, purchase_date: Date.new(2025, 1, 10)
      )

      expect(holding.purchase_fx_rate).to be_nil
    end
  end

  describe "validation" do
    it "raises on invalid type" do
      expect {
        Argpt::Portfolio::Holding.new(
          ticker: "X", type: :bond, shares: 10,
          avg_price: 100.0, purchase_date: Date.new(2025, 1, 1)
        )
      }.to raise_error(ArgumentError, /invalid type/i)
    end

    it "raises on non-positive shares" do
      expect {
        Argpt::Portfolio::Holding.new(
          ticker: "X", type: :cedear, shares: 0,
          avg_price: 100.0, purchase_date: Date.new(2025, 1, 1)
        )
      }.to raise_error(ArgumentError, /shares/i)
    end

    it "raises on negative shares" do
      expect {
        Argpt::Portfolio::Holding.new(
          ticker: "X", type: :cedear, shares: -5,
          avg_price: 100.0, purchase_date: Date.new(2025, 1, 1)
        )
      }.to raise_error(ArgumentError, /shares/i)
    end

    it "raises on zero avg_price" do
      expect {
        Argpt::Portfolio::Holding.new(
          ticker: "X", type: :cedear, shares: 10,
          avg_price: 0, purchase_date: Date.new(2025, 1, 1)
        )
      }.to raise_error(ArgumentError, /avg_price/i)
    end

    it "raises on zero purchase_fx_rate" do
      expect {
        Argpt::Portfolio::Holding.new(
          ticker: "X", type: :cedear, shares: 10,
          avg_price: 100.0, purchase_date: Date.new(2025, 1, 1),
          purchase_fx_rate: 0
        )
      }.to raise_error(ArgumentError, /purchase_fx_rate/i)
    end
  end

  describe "#original_currency" do
    it "returns :ars for cedear" do
      holding = Argpt::Portfolio::Holding.new(
        ticker: "AAPL", type: :cedear, shares: 50,
        avg_price: 14000.0, purchase_date: Date.new(2025, 3, 1)
      )

      expect(holding.original_currency).to eq(:ars)
    end

    it "returns :ars for arg_stock" do
      holding = Argpt::Portfolio::Holding.new(
        ticker: "GGAL", type: :arg_stock, shares: 100,
        avg_price: 4800.0, purchase_date: Date.new(2025, 3, 1)
      )

      expect(holding.original_currency).to eq(:ars)
    end

    it "returns :usd for us_stock" do
      holding = Argpt::Portfolio::Holding.new(
        ticker: "AAPL", type: :us_stock, shares: 10,
        avg_price: 170.0, purchase_date: Date.new(2025, 3, 1)
      )

      expect(holding.original_currency).to eq(:usd)
    end
  end
end
