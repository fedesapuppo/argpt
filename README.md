# ARGPT — Argentine Portfolio Tracker

A free, serverless portfolio tracker for Argentine investors. Tracks CEDEARs, Argentine stocks, and US stocks with dual-currency display (ARS + USD) using real MEP/CCL exchange rates.

## Why ARGPT?

Existing portfolio trackers (Sharesight, Portseido, Portfolio Performance, Ziggma) use official FX rates, which were 50-80% off market pre-2025. ARGPT uses MEP/CCL rates — the rates investors actually get — and decomposes returns into capital vs currency components.

## Architecture

```
Ruby scripts (local) → JSON files → GitHub Pages (static frontend)
```

- **Ruby 3.4.x** — data fetching, portfolio calculations, JSON export
- **Vanilla HTML/CSS/JS** — static frontend on GitHub Pages, no build step
- **No live API calls from browser** — run `bin/fetch_data` to update pre-fetched JSON

## Data Sources

| Source | Provides |
|---|---|
| [Data912](https://data912.com) | Live prices, MEP/CCL rates, Argentine equities, CEDEARs, bonds, US stocks |
| [finance-query.com](https://finance-query.com) | Fundamentals, financial statements, technicals, risk metrics, dividends |
| [ArgentinaDatos](https://argentinadatos.com) | Historical MEP/CCL rates (from ~Oct 2018) |

## Currency Rules

- **Argentine assets** (stocks, CEDEARs) priced in ARS → converted to USD via **MEP rate**
- **US assets** priced in USD → converted to ARS via **CCL rate**
- **CEDEAR USD value** = ARS price / MEP rate (not underlying US stock price)
- **Return decomposition** per holding: capital return (asset price move) vs currency return (MEP/CCL change) — shows when ARS gains mask real USD losses

## Setup

```bash
git clone https://github.com/fedesapuppo/argpt.git
cd argpt
bundle install
```

## Fetching Market Data

Configure which tickers to fetch, then run the pipeline:

```bash
cp config/holdings.yml.sample config/holdings.yml  # edit with your tickers
ruby bin/fetch_data                                  # fetches live data → frontend/data/*.json
```

This hits Data912 and finance-query.com APIs and writes four JSON files (`exchange_rates.json`, `prices.json`, `technicals.json`, `fundamentals.json`) to `frontend/data/`.

## Running the Frontend

The frontend needs a local HTTP server (it fetches JSON via `fetch()`):

```bash
ruby -run -e httpd frontend -p 8000
```

Then open http://localhost:8000.

**Without running `bin/fetch_data`**, the frontend falls back to `.sample.json` files which contain placeholder data for development purposes only — not real market data.

## Tests

```bash
bundle exec rspec
```

## Deployment

Push to `main` and GitHub Actions deploys `frontend/` to GitHub Pages. An optional scheduled workflow (`fetch_data.yml`) runs `bin/fetch_data` weekdays at 18:00 ART and commits fresh data.

## License

MIT
