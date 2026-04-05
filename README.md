# ARGPT — Argentine Portfolio Tracker

**Live:** [fedesapuppo.github.io/argpt](https://fedesapuppo.github.io/argpt/)

> See your real USD return on assets bought with pesos — decomposed into what the stock did vs what the peso did.

## The Problem

Argentine investors buy stocks and CEDEARs with pesos. To know if they're actually making money, they need to answer: "If I sold everything today and converted to dollars via MEP, would I have more or fewer USD than I started with?"

Your broker shows you ARS returns. Portfolio trackers like Sharesight and Portseido show USD returns — but using official exchange rates, not MEP. For Argentina before April 2025, the official rate was 50-80% below the market rate. Neither answer tells you the truth.

ARGPT uses MEP/CCL rates and decomposes every return into three components: how the stock moved, how the peso moved, and what that means in real dollars.

## A Real Example

Here's what this looks like with actual data from an Argentine brokerage account.

### GGAL — same stock, different lots, completely different stories

| Bought | ARS Price | MEP Then | Cost USD | Current ARS | Current USD | ARS Return | Currency | USD Return |
|--------|-----------|----------|----------|-------------|-------------|------------|----------|------------|
| Sep 2021 | 194 | 173 | $1.13 | 6,650 | $4.69 | +3,326% | -87.8% | +316% |
| Jan 2024 | 1,836 | 1,088 | $1.69 | 6,650 | $4.69 | +262% | -23.4% | +178% |
| Jun 2025 | 6,280 | 1,208 | $5.20 | 6,650 | $4.69 | +5.9% | -14.9% | -9.8% |
| Jan 2025 | 7,830 | 1,162 | $6.74 | 6,650 | $4.69 | -15.1% | -18.1% | -30.4% |

*Current GGAL: ARS 6,650. Current MEP: 1,419.24. Current USD: $4.69.*

The September 2021 lot gained 3,326% in pesos. Impressive — until you see the peso lost 88% of its value in that window. Real dollar return: +316%. Still great, but the ARS number was a mirage.

The June 2025 lot went UP 5.9% in pesos but is DOWN 9.8% in real dollars. The peso weakened 15% in those nine months, more than erasing a modest gain.

Without separating capital return from currency return, both lots just show a single number that hides what's actually happening.

### CEDEARs and stock splits — a hidden data problem

When a US stock splits, BYMA adjusts the CEDEAR ratio and the investor receives additional shares. Brokers record these new shares with a purchase price of zero.

This breaks per-lot return calculations. From a real portfolio:

- NVDA: 3 original shares (bought 2021) + 54 shares from ratio changes (cost = 0) + 3 more shares (bought separately)
- Per-lot calculation: original shares show -57%, split shares show infinity
- Correct aggregated calculation: **+764%** in real USD

In the portfolio we analyzed, 16 out of 129 CEDEAR lots had zero cost from ratio changes. Without proper handling, the total CEDEAR USD return calculated as +3.7% — the real number was **+18.2%**.

### Argentine stocks vs CEDEARs — the actual scorecard

Same portfolio, invested since 2020:

| Asset Class | Invested (USD) | Current (USD) | Real USD Return |
|-------------|---------------|---------------|-----------------|
| Argentine Stocks | $8,091 | $10,228 | +26.4% |
| CEDEARs | $9,331 | $11,030 | +18.2% |

Argentine stocks — despite a currency that lost most of its value — outperformed CEDEARs in real dollar terms. This insight is invisible in a peso-denominated broker statement.

## How ARGPT Compares

| | MEP/CCL rates | Historical FX per trade | Capital vs Currency decomposition |
|---|---|---|---|
| Argentine brokers (Balanz, etc.) | Tracks MEP per lot | Excellent raw data | Not computed |
| Sharesight | Official FX only | Per-trade FX | Partial (no MEP) |
| Portseido | Official FX only | Per-trade FX | No |
| Portfolio Performance | Manual custom FX | Manual setup | No |
| **ARGPT** | **MEP/CCL** | **Per-holding** | **Full decomposition** |

Argentine brokers provide excellent data — ARGPT turns it into the analysis they don't show you.

## Features

### Portfolio Tab — Real USD Returns
- USD returns using MEP for ARS-to-USD and CCL for USD-to-ARS
- Return decomposition: Capital Return x Currency Return = Total USD Return
- Cost basis in USD per holding — see exactly what you paid in dollars
- Tracks CEDEARs, Argentine stocks, and US stocks
- Handles CEDEAR ratio changes (stock splits) correctly
- MEP/CCL methodology disclosure — every number is explainable

### Technicals Tab — Technical Analysis
- Key indicators per ticker: RSI(14), Stochastic K/D, Supertrend
- Moving averages: SMA 20/50
- ATH tracking with % below all-time high (Data912 historical data for Argentine stocks, finance-query for US stocks)
- Color-coded signal summary: oversold / neutral / overbought

### Fundamentals Tab — Sector-Relative Valuation
- Per-ticker metrics: P/E, Forward P/E, P/B, ROE, EPS Growth, Dividend Yield, Debt/Equity, Profit Margin
- Color-coded against sector benchmarks (not absolute thresholds) — a P/E of 25 is cheap for Tech but expensive for Energy
- Covers 11 sectors: Technology, Financial Services, Healthcare, Energy, Consumer Cyclical, Consumer Defensive, Industrials, Basic Materials, Real Estate, Utilities, Communication Services
- Sector classification per ticker

### General
- Dark financial dashboard theme — data-dense, monospaced numbers, green/red P&L
- No account needed — localStorage for holdings, GitHub Pages for hosting

## How It Works

```
Ruby scripts (local) → JSON files → GitHub Pages (static frontend)
```

- **Ruby 3.4.x** — data fetching, portfolio calculations, JSON export
- **Tailwind CSS + vanilla JS** — static frontend, no build step
- **No live API calls from browser** — run `bin/fetch_data` to update

**Data sources:** [Data912](https://data912.com) (prices, MEP/CCL), [finance-query.com](https://finance-query.com) (fundamentals, technicals), [ArgentinaDatos](https://argentinadatos.com) (historical MEP/CCL from ~Oct 2018).

## Getting Started

```bash
git clone https://github.com/fedesapuppo/argpt.git
cd argpt
bundle install
```

### Fetch real market data

```bash
cp config/holdings.yml.sample config/holdings.yml  # edit with your tickers
ruby bin/fetch_data                                  # hits live APIs -> frontend/data/*.json
```

### Run the frontend

```bash
ruby -run -e httpd frontend -p 8000
```

Open http://localhost:8000. Without running `bin/fetch_data`, the frontend uses placeholder sample data.

### Run tests

```bash
bundle exec rspec
```

## Methodology

All USD return calculations follow the [currency-rules skill](.claude/skills/currency-rules/SKILL.md).

**Decomposition:**
- Capital return = asset price change in native currency
- Currency return = MEP rate change since purchase
- Total USD return = (1 + capital) x (1 + currency) - 1

**Rates:**
- Argentine assets (stocks, CEDEARs) priced in ARS → USD via MEP rate (AL30 bond pair)
- US assets priced in USD → ARS via CCL rate
- CEDEAR USD value = ARS price / MEP rate (not underlying US stock price)

**Technical indicators** sourced from finance-query.com (GraphQL) and Data912 (historical OHLCV). ATH calculated from full historical data for Argentine stocks, 52-week high for US stocks.

**Fundamental benchmarks** are sector-relative. Each metric is color-coded green/yellow/red based on how the stock compares to its sector median, not arbitrary absolute thresholds.

## Deploy

Push to `main` with changes in `frontend/` triggers GitHub Actions to deploy to Pages. A scheduled workflow runs `bin/fetch_data` weekdays at 18:00 ART and commits updated JSON data.

## Disclaimer

Portfolio data shown in examples is from a real brokerage account, used with permission, for illustrative purposes only. Past performance is not indicative of future results. ARGPT is not financial advice.

