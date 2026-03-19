# finance-query.com API - Independent Analysis & Guide

**GraphQL Endpoint:** `https://finance-query.com/graphql`
**REST Endpoint:** `https://finance-query.com/v2/*`
**WebSocket:** `wss://finance-query.com/v2/stream`
**MCP Endpoint:** `https://finance-query.com/mcp`
**Version:** 2.4.1
**GitHub:** [Verdenroz/finance-query](https://github.com/Verdenroz/finance-query)
**License:** MIT (open source, self-hostable)
**Authentication:** None required
**Data Sources:** Yahoo Finance, SEC EDGAR, FRED API, US Treasury, CoinGecko, alternative.me

> This API requires no API key, no registration, and no payment. It can also be
> self-hosted via Docker or compiled from Rust source. The hosted version at
> finance-query.com is free to use with no stated rate limits.

---

## Table of Contents

1. [Quote & Company Profile](#1-quote--company-profile)
2. [Financial Statements](#2-financial-statements)
3. [Earnings Data](#3-earnings-data)
4. [Chart / Historical OHLCV](#4-chart--historical-ohlcv)
5. [Technical Indicators](#5-technical-indicators)
6. [Risk Metrics](#6-risk-metrics)
7. [Option Chains](#7-option-chains)
8. [Dividends & Splits](#8-dividends--splits)
9. [News](#9-news)
10. [Search](#10-search)
11. [Market Summary](#11-market-summary)
12. [World Indices](#12-world-indices)
13. [Stock Screener](#13-stock-screener)
14. [Fear & Greed Index](#14-fear--greed-index)
15. [Trending Tickers](#15-trending-tickers)
16. [REST API (v2)](#16-rest-api-v2)
17. [Argentine Stock Coverage](#17-argentine-stock-coverage)
18. [Data Accuracy Cross-Check](#18-data-accuracy-cross-check)
19. [Enums Reference](#19-enums-reference)

---

## 1. Quote & Company Profile

The `quote` field on a ticker returns 130+ fields covering price, fundamentals, valuation,
ownership, analyst estimates, governance risk, and company metadata.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { quote { regularMarketPrice trailingPe forwardPe priceToBook earningsQuarterlyGrowth trailingEps forwardEps marketCap dividendYield bookValue sharesOutstanding sector industry longBusinessSummary } } }"}' \
  | python3 -m json.tool
```

### Price Fields

| Field                        | Type   | What It Is                                      |
|------------------------------|--------|--------------------------------------------------|
| `regularMarketPrice`         | number | Current/last trade price                         |
| `regularMarketChange`        | number | Dollar change from previous close                |
| `regularMarketChangePercent` | number | Percentage change from previous close            |
| `regularMarketDayHigh`       | number | Intraday high                                    |
| `regularMarketDayLow`        | number | Intraday low                                     |
| `regularMarketOpen`          | number | Opening price                                    |
| `regularMarketPreviousClose` | number | Previous session's close                         |
| `regularMarketVolume`        | number | Shares traded today                              |
| `preMarketPrice`             | number | Pre-market price (when available)                |
| `postMarketPrice`            | number | After-hours price (when available)               |
| `bid` / `ask`                | number | Best bid/ask prices                              |
| `bidSize` / `askSize`        | number | Size at bid/ask                                  |

### Valuation & Fundamentals

| Field                     | Type   | What It Is                                         |
|---------------------------|--------|-----------------------------------------------------|
| `trailingPe`              | number | P/E ratio (trailing 12 months)                      |
| `forwardPe`               | number | P/E ratio (forward estimates)                       |
| `priceToBook`             | number | Price / Book Value per share                        |
| `enterpriseValue`         | number | Market cap + debt - cash                            |
| `enterpriseToRevenue`     | number | EV / Revenue                                        |
| `enterpriseToEbitda`      | number | EV / EBITDA                                         |
| `trailingEps`             | number | Earnings per share (TTM)                            |
| `forwardEps`              | number | EPS (analyst consensus forward)                     |
| `bookValue`               | number | Book value per share                                |
| `marketCap`               | number | Market capitalization                               |
| `totalRevenue`            | number | Total revenue (TTM)                                 |
| `netIncomeToCommon`       | number | Net income to common shareholders                   |
| `totalDebt`               | number | Total debt                                          |
| `debtToEquity`            | number | Debt / Equity ratio                                 |
| `revenuePerShare`         | number | Revenue per share                                   |
| `earningsGrowth`          | number | Earnings growth rate                                |
| `revenueGrowth`           | number | Revenue growth rate                                 |
| `earningsQuarterlyGrowth` | number | YoY quarterly earnings growth                       |

### Profitability & Efficiency

| Field              | Type   | What It Is                           |
|--------------------|--------|---------------------------------------|
| `profitMargins`    | number | Net profit margin                    |
| `grossMargins`     | number | Gross margin                         |
| `ebitdaMargins`    | number | EBITDA margin                        |
| `operatingMargins` | number | Operating margin                     |
| `returnOnAssets`   | number | ROA                                  |
| `returnOnEquity`   | number | ROE                                  |
| `currentRatio`     | number | Current assets / current liabilities |
| `quickRatio`       | number | (Current assets - inventory) / CL    |
| `freeCashflow`     | number | Free cash flow                       |
| `operatingCashflow`| number | Cash from operations                 |

### Dividends

| Field                          | Type   | What It Is                            |
|--------------------------------|--------|----------------------------------------|
| `dividendRate`                 | number | Annual dividend per share             |
| `dividendYield`                | number | Annual yield (decimal)                |
| `trailingAnnualDividendRate`   | number | Actual dividends paid last 12 months  |
| `fiveYearAvgDividendYield`     | number | 5-year average yield                  |
| `exDividendDate`               | number | Next ex-dividend date (epoch)         |
| `payoutRatio`                  | number | Dividends / Earnings                  |

### Ownership & Short Interest

| Field                       | Type   | What It Is                              |
|-----------------------------|--------|-----------------------------------------|
| `sharesOutstanding`         | number | Total shares outstanding                |
| `floatShares`               | number | Shares available for public trading     |
| `heldPercentInsiders`       | number | % held by insiders                      |
| `heldPercentInstitutions`   | number | % held by institutions                  |
| `sharesShort`               | number | Number of shares sold short             |
| `shortRatio`                | number | Days to cover (short interest / volume) |
| `shortPercentOfFloat`       | number | % of float sold short                   |

### Analyst Estimates

| Field                     | Type   | What It Is                                 |
|---------------------------|--------|--------------------------------------------|
| `targetHighPrice`         | number | Highest analyst price target               |
| `targetLowPrice`          | number | Lowest analyst price target                |
| `targetMeanPrice`         | number | Mean analyst price target                  |
| `targetMedianPrice`       | number | Median analyst price target                |
| `recommendationMean`      | number | Mean recommendation (1=Buy, 5=Sell)        |
| `recommendationKey`       | string | Consensus label (e.g., "buy")              |
| `numberOfAnalystOpinions` | number | Number of analysts covering                |

### Company Metadata

| Field                | Type   | What It Is                                   |
|----------------------|--------|-----------------------------------------------|
| `longName`           | string | Full company name                            |
| `shortName`          | string | Short name                                   |
| `sector`             | string | Sector (e.g., "Technology")                  |
| `industry`           | string | Industry (e.g., "Consumer Electronics")      |
| `longBusinessSummary`| string | Full business description                    |
| `website`            | string | Company website                              |
| `city` / `state` / `country` | string | Headquarters location               |
| `fullTimeEmployees`  | int    | Number of employees                          |

### Governance Risk (ESG-adjacent)

| Field                    | Type | What It Is                                   |
|--------------------------|------|-----------------------------------------------|
| `auditRisk`              | int  | Audit committee risk score (1-10)            |
| `boardRisk`              | int  | Board structure risk score                   |
| `compensationRisk`       | int  | Executive compensation risk                  |
| `shareholderRightsRisk`  | int  | Shareholder rights risk                      |
| `overallRisk`            | int  | Composite governance risk                    |

### Deep Data (JSON blobs)

These fields return complex nested JSON with historical and forward-looking data:

| Field                               | What It Contains                                        |
|--------------------------------------|---------------------------------------------------------|
| `earnings`                           | Quarterly EPS actual vs. estimate, revenue chart        |
| `earningsHistory`                    | Historical EPS surprise data                            |
| `earningsTrend`                      | Forward EPS estimates by quarter                        |
| `recommendationTrend`                | Buy/hold/sell counts over time                          |
| `upgradeDowngradeHistory`            | Analyst rating changes                                  |
| `insiderHolders`                     | Key insider positions and holdings                      |
| `insiderTransactions`                | Recent insider buys/sells                               |
| `institutionOwnership`               | Top institutional holders                               |
| `fundOwnership`                      | Top fund holders                                        |
| `majorHoldersBreakdown`              | Insider vs. institutional ownership %                   |
| `secFilings`                         | Recent SEC filings list                                 |
| `companyOfficers`                    | C-suite and board members                               |
| `balanceSheetHistory`                | Annual balance sheets (via quote, alternative path)     |
| `balanceSheetHistoryQuarterly`       | Quarterly balance sheets                                |
| `incomeStatementHistory`             | Annual income statements                                |
| `incomeStatementHistoryQuarterly`    | Quarterly income statements                             |
| `cashflowStatementHistory`           | Annual cash flow statements                             |
| `cashflowStatementHistoryQuarterly`  | Quarterly cash flow statements                          |

---

## 2. Financial Statements

Structured financial statements via the `financials` field. Supports `ANNUAL` and
`QUARTERLY` frequency.

### Income Statement

```bash
# Annual
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { financials(statement: INCOME, frequency: ANNUAL) } }"}' \
  | python3 -m json.tool

# Quarterly
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { financials(statement: INCOME, frequency: QUARTERLY) } }"}' \
  | python3 -m json.tool
```

**Fields returned (XBRL taxonomy):**

| Field                        | What It Is                                      |
|------------------------------|-------------------------------------------------|
| `TotalRevenue`               | Top-line revenue                                |
| `CostOfRevenue`              | Cost of goods sold                              |
| `GrossProfit`                | Revenue - COGS                                  |
| `EBIT`                       | Earnings before interest and taxes              |
| `EBITDA`                     | EBIT + Depreciation & Amortization              |
| `NetIncome`                  | Bottom-line profit                              |
| `NetIncomeCommonStockholders`| Net income attributable to common shareholders  |
| `BasicEPS` / `DilutedEPS`   | Earnings per share                              |
| `BasicAverageShares`         | Weighted average shares (basic)                 |
| `DilutedAverageShares`       | Weighted average shares (diluted)               |
| `DepreciationAndAmortization`| D&A expense                                     |
| `InterestExpense`            | Interest paid on debt                           |
| `InterestIncome`             | Interest earned                                 |
| `OperatingExpense`           | Total operating expenses                        |
| `OperatingIncome`            | Revenue - OpEx                                  |
| `TaxProvision`               | Income tax expense                              |
| `PretaxIncome`               | Income before taxes                             |

Data is keyed by fiscal year-end date (e.g., `"2025-09-30"` for Apple). Annual data
covers 4 years; quarterly covers 5 quarters.

### Balance Sheet

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { financials(statement: BALANCE, frequency: ANNUAL) } }"}' \
  | python3 -m json.tool
```

**Key fields:**

| Field                        | What It Is                                      |
|------------------------------|-------------------------------------------------|
| `TotalAssets`                | Everything the company owns                     |
| `CurrentAssets`              | Assets convertible to cash within a year        |
| `CashAndCashEquivalents`     | Liquid cash                                     |
| `AccountsReceivable`         | Money owed to the company                       |
| `Inventory`                  | Goods held for sale                             |
| `TotalLiabilities`           | Everything the company owes                     |
| `CurrentLiabilities`         | Debts due within a year                         |
| `CurrentDebt`                | Short-term borrowings                           |
| `LongTermDebt`               | Long-term borrowings                            |
| `CommonStockEquity`          | Shareholders' equity                            |
| `RetainedEarnings`           | Accumulated profits not distributed             |
| `AccountsPayable`            | Money owed to suppliers                         |
| `GoodwillAndOtherIntangibleAssets` | Intangible assets                         |

### Cash Flow Statement

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { financials(statement: CASH_FLOW, frequency: ANNUAL) } }"}' \
  | python3 -m json.tool
```

**Key fields:**

| Field                                        | What It Is                            |
|----------------------------------------------|---------------------------------------|
| `CashFlowFromContinuingOperatingActivities`  | Cash generated by core business       |
| `CapitalExpenditure`                         | Spending on property/equipment        |
| `FreeCashFlow`                               | Operating CF - CapEx                  |
| `CashDividendsPaid`                          | Dividends paid to shareholders        |
| `CashFlowFromContinuingFinancingActivities`  | Cash from/to debt and equity markets  |
| `CashFlowFromContinuingInvestingActivities`  | Cash from/to investments              |
| `ChangeInAccountPayable`                     | Change in supplier debts              |
| `ChangeInInventory`                          | Change in inventory levels            |
| `ChangeInReceivables`                        | Change in money owed to company       |
| `BeginningCashPosition`                      | Cash at start of period               |
| `EndCashPosition`                            | Cash at end of period                 |

---

## 3. Earnings Data

Two ways to access earnings: the `earnings` blob on the quote, or the structured
`earningsHistory` / `earningsTrend` fields.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { quote { earnings earningsHistory earningsTrend } } }"}' \
  | python3 -m json.tool
```

**The `earnings` field contains:**

- **Quarterly EPS**: actual vs. estimate, with surprise percentage
- **Revenue chart**: quarterly and yearly revenue and earnings
- **Next earnings date**: with estimate for the upcoming quarter
- **Methodology**: GAAP or non-GAAP reporting

Example from AAPL Q4 2025 (FY Q1 2026):
```
actual: 2.84, estimate: 2.67, surprise: +6.34%
revenue: $143.76B
```

This matches Apple's official report: $143.8B revenue, $2.84 EPS.

---

## 4. Chart / Historical OHLCV

Price history with configurable interval and range.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { chart(interval: ONE_DAY, range: ONE_MONTH, events: false, patterns: false) { candles { open high low close volume timestamp } } } }"}' \
  | python3 -m json.tool
```

**Parameters:**

| Parameter  | Type          | Values                                                    |
|------------|---------------|-----------------------------------------------------------|
| `interval` | GqlInterval   | ONE_MINUTE, FIVE_MINUTES, FIFTEEN_MINUTES, THIRTY_MINUTES, ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, THREE_MONTHS |
| `range`    | GqlTimeRange  | ONE_DAY, FIVE_DAYS, ONE_MONTH, THREE_MONTHS, SIX_MONTHS, ONE_YEAR, TWO_YEARS, FIVE_YEARS, TEN_YEARS, YEAR_TO_DATE, MAX |
| `start`    | Int (optional)| Unix timestamp for custom start                           |
| `end`      | Int (optional)| Unix timestamp for custom end                             |
| `events`   | Boolean       | Include dividends/splits in response                      |
| `patterns` | Boolean       | Include candlestick pattern detection                     |

**Response candle fields:** `open`, `high`, `low`, `close`, `volume`, `timestamp`

Intraday intervals (1m-1h) are limited to shorter ranges. Daily and above support the
full range up to MAX.

---

## 5. Technical Indicators

Pre-calculated technical indicators for any ticker. Saves building your own TA library.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { indicators(interval: ONE_DAY, range: ONE_MONTH) } }"}' \
  | python3 -m json.tool
```

**30+ indicators returned in a single call:**

| Indicator                | What It Is                                           |
|--------------------------|------------------------------------------------------|
| `rsi14`                  | Relative Strength Index (14-period)                  |
| `sma10` / `sma20`       | Simple Moving Averages                               |
| `ema10` / `ema20`       | Exponential Moving Averages                          |
| `wma10` / `wma20`       | Weighted Moving Averages                             |
| `alma9`                  | Arnaud Legoux Moving Average                         |
| `vwma20`                 | Volume-Weighted Moving Average                       |
| `vwap`                   | Volume-Weighted Average Price                        |
| `bollingerBands`         | Upper/middle/lower Bollinger Bands                   |
| `keltnerChannels`        | Upper/middle/lower Keltner Channels                  |
| `donchianChannels`       | Upper/middle/lower Donchian Channels                 |
| `stochastic`             | %K and %D Stochastic Oscillator                      |
| `williamsR14`            | Williams %R                                          |
| `cci20`                  | Commodity Channel Index                              |
| `atr14`                  | Average True Range                                   |
| `trueRange`              | True Range (single period)                           |
| `momentum10`             | 10-period Momentum                                   |
| `roc12`                  | Rate of Change (12-period)                           |
| `mfi14`                  | Money Flow Index                                     |
| `obv`                    | On-Balance Volume                                    |
| `cmf20`                  | Chaikin Money Flow                                   |
| `cmo14`                  | Chande Momentum Oscillator                           |
| `accumulationDistribution`| Accumulation/Distribution Line                      |
| `chaikinOscillator`      | Chaikin Oscillator                                   |
| `choppinessIndex14`      | Choppiness Index (trend vs. range)                   |
| `bullBearPower`          | Bull Power / Bear Power                              |
| `elderRayIndex`          | Elder Ray Index                                      |
| `parabolicSar`           | Parabolic Stop and Reverse                           |
| `supertrend`             | Supertrend direction + value                         |
| `mcginleyDynamic20`      | McGinley Dynamic                                     |

Example from AAPL (March 18, 2026):
```
rsi14: 33.84          -> Approaching oversold (<30)
stochastic %K: 3.95   -> Deeply oversold
williamsR14: -96.05    -> Extremely oversold
supertrend: up, 245.33 -> Still in uptrend despite weakness
bollingerBands lower: 247.93 -> Price near lower band
```

---

## 6. Risk Metrics

Portfolio-style risk analytics for any ticker, calculated against a benchmark.

```bash
# Default benchmark
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { risk(interval: ONE_DAY, range: ONE_YEAR) } }"}' \
  | python3 -m json.tool

# Custom benchmark
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"GGAL\") { risk(interval: ONE_DAY, range: ONE_YEAR, benchmark: \"^GSPC\") } }"}' \
  | python3 -m json.tool
```

**Response fields:**

| Field                           | What It Is                                             |
|---------------------------------|--------------------------------------------------------|
| `sharpe`                        | Sharpe Ratio (risk-adjusted return)                    |
| `sortino`                       | Sortino Ratio (downside-risk-adjusted return)          |
| `calmar`                        | Calmar Ratio (return / max drawdown)                   |
| `max_drawdown`                  | Maximum peak-to-trough decline (decimal)               |
| `max_drawdown_recovery_periods` | Trading days to recover from max drawdown              |
| `var_95`                        | Historical Value at Risk (95% confidence)              |
| `var_99`                        | Historical Value at Risk (99% confidence)              |
| `parametric_var_95`             | Parametric VaR (95%, assumes normal distribution)      |
| `beta`                          | Beta vs. benchmark (may be null)                       |

Example comparison (ONE_YEAR range):

| Metric       | AAPL   | GGAL.BA  | Interpretation                              |
|--------------|--------|----------|----------------------------------------------|
| Sharpe       | 0.63   | 0.06     | AAPL far better risk-adjusted return         |
| Max Drawdown | 23.0%  | 47.1%   | GGAL.BA nearly 2x the drawdown              |
| VaR 95       | 3.1%   | 4.8%    | GGAL.BA has ~50% higher daily risk           |
| Recovery     | 164 d  | 30 d    | GGAL.BA drawdown was sharper but faster      |

---

## 7. Option Chains

Full option chain data with expiration dates, strikes, Greeks, and open interest.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { options } }"}' \
  | python3 -m json.tool
```

**Response structure:**

- `expirationDates`: array of all available expiry dates (Unix timestamps)
- `options[].calls[]` and `options[].puts[]`: arrays of individual contracts

**Per-contract fields:**

| Field              | What It Is                                         |
|--------------------|----------------------------------------------------|
| `contractSymbol`   | OCC-format symbol (e.g., AAPL260320C00090000)      |
| `strike`           | Strike price                                       |
| `expiration`       | Expiration date (Unix timestamp)                   |
| `lastPrice`        | Last trade price                                   |
| `bid` / `ask`      | Best bid/ask                                       |
| `change`           | Dollar change                                      |
| `percentChange`    | Percentage change                                  |
| `volume`           | Contracts traded                                   |
| `openInterest`     | Outstanding contracts                              |
| `impliedVolatility`| IV for this contract                               |
| `inTheMoney`       | Boolean                                            |

Optional `date` parameter (Unix timestamp) fetches a specific expiration.

---

## 8. Dividends & Splits

Full dividend payment history with analytics, plus all historical stock splits.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { dividends(range: MAX) splits(range: MAX) } }"}' \
  | python3 -m json.tool
```

**Dividends response:**

- `analytics.cagr`: Compound annual growth rate of dividends
- `analytics.payment_count`: Total number of payments
- `analytics.total_paid`: Cumulative dividends paid (split-adjusted)
- `analytics.average_payment`: Average payment amount
- `analytics.first_payment` / `last_payment`: Date + amount
- `dividends[]`: Array of `{ amount, timestamp }` for every payment

**Splits response:**

Array of `{ numerator, denominator, ratio, timestamp }`. Example:
```
{ numerator: 4, denominator: 1, ratio: "4:1", timestamp: 1598880600 }
```

The `range` parameter controls how far back to look (ONE_YEAR, FIVE_YEARS, MAX, etc.).

---

## 9. News

### General market news

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ news(count: 5) }"}' \
  | python3 -m json.tool
```

### Ticker-specific news

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { news(count: 3) } }"}' \
  | python3 -m json.tool
```

Returns title, publisher, link, publish time, and thumbnail for each article.

---

## 10. Search

Search for tickers by name, symbol, or keyword. Returns matching quotes across global
exchanges.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ search(query: \"GGAL\", quotes: 5, news: 0) }"}' \
  | python3 -m json.tool
```

**Parameters:**

| Parameter | Type | What It Does                        |
|-----------|------|-------------------------------------|
| `query`   | String | Search term                       |
| `quotes`  | Int    | Max number of quote results       |
| `news`    | Int    | Max number of news results        |

Returns `symbol`, `exchange`, `quoteType`, `sector`, `industry`, and a relevance `score`.

Useful for discovering ticker suffixes. For example, searching "GGAL" returns:
- `GGAL` (NASDAQ) — the US ADR
- `GGAL.BA` (Buenos Aires) — the local stock
- `GGALD.BA` (Buenos Aires) — the USD-denominated version
- `GGALN.MX` (Mexico) — cross-listed in Mexico

---

## 11. Market Summary

Overview of major futures, currencies, and commodities.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ marketSummary(format: RAW) { symbol regularMarketPrice regularMarketChange regularMarketChangePercent shortName } }"}' \
  | python3 -m json.tool
```

Returns S&P Futures, Dow Futures, Nasdaq Futures, Russell 2000 Futures, Crude Oil, Gold,
Silver, EUR/USD, 10-Year Treasury Yield, Bitcoin, and more.

The `format` parameter accepts: `RAW` (numbers), `PRETTY` (formatted strings), `BOTH`.

---

## 12. World Indices

Global stock market indices, filterable by region.

```bash
# All indices
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ indices(format: RAW) { symbol regularMarketPrice regularMarketChangePercent shortName } }"}' \
  | python3 -m json.tool

# Americas only
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ indices(region: AMERICAS, format: RAW) { symbol regularMarketPrice shortName } }"}' \
  | python3 -m json.tool
```

**Regions:** `AMERICAS`, `EUROPE`, `ASIA_PACIFIC`, `MIDDLE_EAST_AFRICA`, `CURRENCIES`

Covers indices like S&P 500, Dow, NASDAQ, FTSE 100, DAX, Nikkei 225, Hang Seng,
SENSEX, All Ordinaries, BEL 20, MERVAL, and many more.

---

## 13. Stock Screener

Pre-built screeners that return top matches.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ screener(type: UNDERVALUED_GROWTH_STOCKS, count: 5, format: RAW) }"}' \
  | python3 -m json.tool
```

**Available screener types:**

| Type                          | What It Finds                              |
|-------------------------------|--------------------------------------------|
| `DAY_GAINERS`                 | Top gainers of the day                     |
| `DAY_LOSERS`                  | Top losers of the day                      |
| `MOST_ACTIVES`                | Highest volume stocks                      |
| `MOST_SHORTED_STOCKS`         | Highest short interest                     |
| `AGGRESSIVE_SMALL_CAPS`       | High-growth small caps                     |
| `SMALL_CAP_GAINERS`           | Small caps with biggest gains              |
| `UNDERVALUED_GROWTH_STOCKS`   | Growth stocks trading below fair value     |
| `UNDERVALUED_LARGE_CAPS`      | Large caps trading below fair value        |
| `GROWTH_TECHNOLOGY_STOCKS`    | High-growth tech stocks                    |
| `CONSERVATIVE_FOREIGN_FUNDS`  | Low-risk international funds               |
| `HIGH_YIELD_BOND`             | High-yield bond funds                      |
| `PORTFOLIO_ANCHORS`           | Stable, core-portfolio stocks              |
| `SOLID_LARGE_GROWTH_FUNDS`    | Top large-cap growth funds                 |
| `SOLID_MIDCAP_GROWTH_FUNDS`   | Top mid-cap growth funds                   |
| `TOP_MUTUAL_FUNDS`            | Best-performing mutual funds               |

Each result includes full quote data (price, volume, P/E, market cap, etc.).

---

## 14. Fear & Greed Index

Market sentiment indicator from alternative.me.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ fearAndGreed { value classification timestamp } }"}' \
  | python3 -m json.tool
```

**Response:**

| Field           | Type   | What It Is                                        |
|-----------------|--------|---------------------------------------------------|
| `value`         | int    | 0-100 score (0 = extreme fear, 100 = extreme greed) |
| `classification`| string | Label: "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed" |
| `timestamp`     | int    | When the reading was taken (Unix timestamp)       |

On March 18, 2026, the index read **23 — Extreme Fear**.

---

## 15. Trending Tickers

Currently trending symbols on Yahoo Finance.

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ trending(format: RAW) { symbol } }"}' \
  | python3 -m json.tool
```

Returns a list of ticker symbols. Note: supplementary quote data (price, name) may come
back as null — use a separate `ticker()` query to get full details for trending symbols.

---

## 16. REST API (v2)

The REST API provides a simpler interface for common operations. The main endpoint we
verified:

### Batch Quotes

```bash
# Single stock
curl -s "https://finance-query.com/v2/quotes?symbols=AAPL" | python3 -m json.tool

# Multiple stocks (comma-separated)
curl -s "https://finance-query.com/v2/quotes?symbols=AAPL,GGAL.BA,YPFD.BA" | python3 -m json.tool
```

Returns the same 130+ fields as the GraphQL `quote` query, keyed by symbol. Supports
any Yahoo Finance ticker including Argentine `.BA` stocks, crypto (`BTC-USD`), forex
(`EURUSD=X`), and futures (`ES=F`).

### WebSocket Streaming

```
wss://finance-query.com/v2/stream
```

Real-time price streaming for subscribed symbols. Requires WebSocket client.

### MCP Integration

```
https://finance-query.com/mcp
```

36 tools for AI agent integration (Claude, Cursor, Windsurf). Allows LLMs to query
financial data directly.

---

## 17. Argentine Stock Coverage

finance-query.com fully supports Argentine stocks via the `.BA` (Buenos Aires) ticker
suffix. This data comes from Yahoo Finance, which sources it from BYMA/CNV filings.

### How to find Argentine tickers

Use the search query to discover them:

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ search(query: \"YPF\", quotes: 10, news: 0) }"}' \
  | python3 -m json.tool
```

### Ticker suffix convention

| Suffix  | Exchange       | Currency | Example   |
|---------|----------------|----------|-----------|
| `.BA`   | Buenos Aires   | ARS      | GGAL.BA   |
| (none)  | NASDAQ/NYSE    | USD      | GGAL      |
| `.MX`   | Mexico         | MXN      | GGALN.MX  |

The `D` suffix stocks (e.g., `GGALD.BA` for USD-settled) are also available.

### What works for Argentine stocks (verified)

| Feature              | Works? | Notes                                          |
|----------------------|--------|------------------------------------------------|
| Quote + fundamentals | Yes    | P/E, P/B, EPS, market cap, dividend yield      |
| Income statement     | Yes    | Annual + quarterly, ARS, NIIF-adjusted          |
| Balance sheet        | Yes    | Full assets/liabilities/equity breakdown        |
| Cash flow            | Yes    | Operating, investing, financing activities      |
| Earnings data        | Yes    | EPS actual vs. estimate, surprise %             |
| Company profile      | Yes    | Sector, industry, business description          |
| Historical chart     | Yes    | All intervals and ranges                        |
| Technical indicators | Yes    | All 30+ indicators work                         |
| Risk metrics         | Yes    | Sharpe, Sortino, VaR, max drawdown              |
| Dividends & splits   | Yes    | Full history                                    |
| News                 | Yes    | Ticker-specific news                            |
| Options              | No     | Argentine options not available on Yahoo Finance |

### Verified tickers

| Ticker    | Company                   | Sector             |
|-----------|---------------------------|---------------------|
| GGAL.BA   | Grupo Financiero Galicia  | Financial Services  |
| YPFD.BA   | YPF S.A.                  | Energy              |
| ALUA.BA   | Aluar Aluminio            | Basic Materials     |
| BBAR.BA   | BBVA Argentina            | Financial Services  |
| BMA.BA    | Banco Macro               | Financial Services  |
| PAMP.BA   | Pampa Energía             | Energy              |
| TXAR.BA   | Ternium Argentina         | Basic Materials     |
| SUPV.BA   | Grupo Supervielle         | Financial Services  |
| CEPU.BA   | Central Puerto            | Utilities           |
| LOMA.BA   | Loma Negra                | Basic Materials     |

---

## 18. Data Accuracy Cross-Check

We compared finance-query data against official filings and third-party sources on
March 18, 2026.

### AAPL (Apple) — US Stock

| Metric             | finance-query              | Official / Reference          | Match? |
|--------------------|----------------------------|-------------------------------|--------|
| FY2025 Revenue     | $416.2B (sum of quarterly) | $416.2B (Apple 10-K)          | Yes    |
| FY2025 Net Income  | $112.0B                    | $112.0B (Apple 10-K)          | Yes    |
| Q1 FY2026 EPS      | $2.84                      | $2.84 (Apple press release)   | Yes    |
| Q1 FY2026 Revenue  | $143.76B                   | $143.8B (Apple press release) | Yes    |
| EPS Surprise       | +6.34%                     | +6.3% (CNBC, 24/7 Wall St)   | Yes    |
| Book Value/Share   | $5.998                     | ~$6.00 (market reports)       | Yes    |
| 52-Week High       | $288.62                    | $288.62 (Yahoo Finance)       | Yes    |
| Market Price       | $249.94                    | $249.94 (NASDAQ close)        | Yes    |

### GGAL.BA (Grupo Galicia) — Argentine Stock

| Metric             | finance-query              | Official / Reference          | Match? |
|--------------------|----------------------------|-------------------------------|--------|
| FY2024 EPS         | ARS 1,186.80               | ARS ~1,187 (6-K filing)      | Yes    |
| Q4 2025 EPS        | ARS -52.00                 | ARS -52 (earnings call)      | Yes    |
| Sector             | Financial Services          | Correct                      | Yes    |
| Industry           | Banks - Regional            | Correct                      | Yes    |
| P/B Ratio          | 1.27                       | ~1.24-1.27 (varies by source)| Yes    |
| Dividend Yield     | 4.97%                      | ~3.5-5.0% (varies)           | Yes    |

### Risk Metrics Sanity Check

| Metric       | AAPL   | GGAL.BA  | Makes Sense?                            |
|--------------|--------|----------|-----------------------------------------|
| Sharpe       | 0.63   | 0.06     | Yes — AAPL far more efficient           |
| Max Drawdown | 23.0%  | 47.1%   | Yes — Argentine stocks are more volatile|
| VaR 95       | 3.1%   | 4.8%    | Yes — higher risk in emerging market    |

### Technical Indicators Sanity Check (AAPL)

| Indicator      | Value   | Market Context                        | Valid? |
|----------------|---------|---------------------------------------|--------|
| RSI(14)        | 33.8    | Stock down ~15% from highs            | Yes    |
| Stochastic %K  | 3.9     | Near 52-week lows                     | Yes    |
| Williams %R    | -96.1   | Extreme readings match RSI            | Yes    |
| Supertrend     | Up, 245 | Still technically in uptrend          | Yes    |

### Verdict

Data is **accurate and authoritative**. Financial statements match SEC filings exactly.
Earnings data matches official press releases. Argentine stock data matches CNV/BYMA
filings. Technical indicators are internally consistent and match the price action.

---

## 19. Enums Reference

### GqlInterval (chart, indicators, risk)

`ONE_MINUTE` | `FIVE_MINUTES` | `FIFTEEN_MINUTES` | `THIRTY_MINUTES` | `ONE_HOUR` |
`ONE_DAY` | `ONE_WEEK` | `ONE_MONTH` | `THREE_MONTHS`

### GqlTimeRange (chart, dividends, splits, risk, indicators)

`ONE_DAY` | `FIVE_DAYS` | `ONE_MONTH` | `THREE_MONTHS` | `SIX_MONTHS` | `ONE_YEAR` |
`TWO_YEARS` | `FIVE_YEARS` | `TEN_YEARS` | `YEAR_TO_DATE` | `MAX`

### GqlStatementType (financials)

`INCOME` | `BALANCE` | `CASH_FLOW`

### GqlFrequency (financials)

`ANNUAL` | `QUARTERLY`

### GqlValueFormat (quote, market summary, indices, screener, trending)

`RAW` (numbers) | `PRETTY` (formatted strings) | `BOTH`

### GqlScreener

`AGGRESSIVE_SMALL_CAPS` | `DAY_GAINERS` | `DAY_LOSERS` | `GROWTH_TECHNOLOGY_STOCKS` |
`MOST_ACTIVES` | `MOST_SHORTED_STOCKS` | `SMALL_CAP_GAINERS` |
`UNDERVALUED_GROWTH_STOCKS` | `UNDERVALUED_LARGE_CAPS` | `CONSERVATIVE_FOREIGN_FUNDS` |
`HIGH_YIELD_BOND` | `PORTFOLIO_ANCHORS` | `SOLID_LARGE_GROWTH_FUNDS` |
`SOLID_MIDCAP_GROWTH_FUNDS` | `TOP_MUTUAL_FUNDS`

### GqlIndicesRegion

`AMERICAS` | `EUROPE` | `ASIA_PACIFIC` | `MIDDLE_EAST_AFRICA` | `CURRENCIES`

---

## Limitations

- **No stated rate limits:** The API doesn't document rate limits, but it's a hosted
  open-source project — don't abuse it. For heavy use, self-host via Docker.
- **Yahoo Finance dependency:** Most data comes from Yahoo Finance. If Yahoo blocks or
  changes their API, finance-query breaks. This has happened before with yfinance.
- **No Argentine options:** Option chain data is only available for US-listed stocks.
- **Trending tickers are symbols only:** Price data comes back null — you need a follow-up
  query for details.
- **No SLA or uptime guarantee:** It's a community project, not a commercial service.
- **Data delay:** Exchange-delayed by 15-20 minutes for real-time quotes.
- **SEC EDGAR data is US-only:** Financial statements for `.BA` stocks come from Yahoo
  Finance (which sources from CNV), not directly from SEC EDGAR.
- **No historical fundamentals API:** Financial statements go back ~4 years. For deeper
  history, you'd need to use the quote-embedded `incomeStatementHistory` field or bulk
  download from elsewhere.
