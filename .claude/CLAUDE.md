# ARGPT — Argentine Portfolio Tracker

Pure Ruby serverless project. No Rails.

## Conventions

- `Argpt::` namespace for all classes
- `bundle exec rspec` for running tests (not mise)
- JSON fixtures in `spec/fixtures/` for webmock stubs
- Prefer namespaced service objects: `Argpt::Namespace::ClassName#call`

## Domain Language

- **holding**: A position in a portfolio (ticker + quantity)
- **MEP**: Dolar MEP — implicit USD rate via local bond/CEDEAR trades
- **CCL**: Dolar CCL — implicit USD rate via ADR arbitrage (settles abroad)
- **CEDEAR**: Argentine Depositary Receipt (local wrapper for US stocks)
- **arg_stock**: Argentine equity listed on BYMA
- **us_stock**: US equity listed on NYSE/NASDAQ

## Data Sources

- **Data912** (`data912.com`): Live prices, MEP/CCL rates, Argentine equities, CEDEARs, bonds, US stocks
- **finance-query.com**: Fundamentals, financial statements, technicals, risk metrics, dividends

## Ticker Conventions

- Data912: no suffix = ARS, `D` suffix = USD (MEP), `C` suffix = Cable (CCL)
- finance-query: US tickers as-is (`AAPL`), Argentine tickers with `.BA` suffix (`GGAL.BA`)

## Currency Rules

- Argentine assets priced in ARS → use MEP rate for USD conversion
- US assets priced in USD → use CCL rate for ARS conversion
- CEDEAR USD value = ARS price / MEP rate
