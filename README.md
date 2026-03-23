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

## Tests

```bash
bundle exec rspec
```

## License

MIT
