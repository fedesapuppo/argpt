require "spec_helper"

RSpec.describe "Portfolio integration" do
  it "calculates a mixed portfolio with composite price keys" do
    mep_data = JSON.parse(load_fixture("data912_mep.json"), symbolize_names: true)
    ccl_data = JSON.parse(load_fixture("data912_ccl.json"), symbolize_names: true)
    mep = Argpt::Portfolio::ExchangeRate.best(mep_data)
    ccl = Argpt::Portfolio::ExchangeRate.best(ccl_data)

    expect(mep.mark).to eq(1177.50)
    expect(ccl.mark).to eq(1207.50)

    holdings = [
      Argpt::Portfolio::Holding.new(
        ticker: "GGAL", type: :arg_stock, shares: 100,
        avg_price: 4800.0, purchase_date: Date.new(2025, 6, 15), purchase_fx_rate: 1100.0
      ),
      Argpt::Portfolio::Holding.new(
        ticker: "AAPL", type: :cedear, shares: 50,
        avg_price: 14000.0, purchase_date: Date.new(2025, 3, 1), purchase_fx_rate: 1050.0
      ),
      Argpt::Portfolio::Holding.new(
        ticker: "AAPL", type: :us_stock, shares: 10,
        avg_price: 170.0, purchase_date: Date.new(2025, 1, 10)
      )
    ]

    prices = {
      "GGAL:arg_stock" => { last: 5200.0, change: 2.5 },
      "AAPL:cedear" => { last: 15200.0, change: 0.8 },
      "AAPL:us_stock" => { last: 185.50, change: 1.2 }
    }

    result = Argpt::Portfolio::Calculator.new(holdings:, prices:, mep_rate: mep, ccl_rate: ccl).call

    ggal_usd = 100 * 5200.0 / 1177.50
    expect(result.holdings[0].current_price_usd).to be_within(0.01).of(5200.0 / 1177.50)

    cedear_usd = 50 * 15200.0 / 1177.50
    expect(result.holdings[1].current_price_usd).to be_within(0.01).of(15200.0 / 1177.50)

    us_usd = 10 * 185.50
    expect(result.holdings[2].current_price_usd).to eq(185.50)

    total_usd = ggal_usd + cedear_usd + us_usd
    expect(result.total_value_usd).to be_within(0.01).of(total_usd)

    ggal_entry = 4800.0 / 1100.0
    ggal_current = 5200.0 / 1177.50
    expect(result.holdings[0].pnl_usd).to be_within(0.01).of((ggal_current - ggal_entry) * 100)

    expect(result.holdings[2].pnl_usd).to be_within(0.01).of((185.50 - 170.0) * 10)

    expect(result.holdings.sum(&:weight_pct)).to be_within(0.01).of(100.0)
  end
end
