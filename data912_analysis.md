# Data912.com API - Independent Analysis & Guide

**API Base URL:** `https://data912.com`
**Version:** 9.12.18
**Provider:** Milton Casco Data Center Inc.
**Authentication:** None required (fully open)
**Rate Limit:** 120 req/min (live & historical), 1 req/min (contact)
**Refresh Rate:** ~20 seconds, with 2-hour Cloudflare caching

> The API states it is "purely for educational purposes" and "nothing here is real-time."
> In practice, we found the data to be near-real-time with small delays, and consistently
> close to values reported by major Argentine financial portals and US exchanges.

---

## Table of Contents

1. [Dollar Exchange Rates (MEP & CCL)](#1-dollar-exchange-rates-mep--ccl)
2. [Argentine Equities](#2-argentine-equities)
3. [CEDEARs (Argentine Depositary Receipts)](#3-cedears-argentine-depositary-receipts)
4. [Argentine Options](#4-argentine-options)
5. [Argentine Government Bonds](#5-argentine-government-bonds)
6. [Argentine Government Notes (Letras)](#6-argentine-government-notes-letras)
7. [Argentine Corporate Debt](#7-argentine-corporate-debt)
8. [US ADRs](#8-us-adrs)
9. [US Stocks](#9-us-stocks)
10. [Historical OHLC Data](#10-historical-ohlc-data)
11. [US Volatility Analytics (EOD)](#11-us-volatility-analytics-eod)
12. [US Option Chains (EOD)](#12-us-option-chains-eod)
13. [Data Accuracy Cross-Check](#13-data-accuracy-cross-check)
14. [The Fundamentals Gap (Solved)](#14-the-fundamentals-gap-solved)

---

## 1. Dollar Exchange Rates (MEP & CCL)

### What are these?

Argentina has multiple exchange rates. The official rate is set by the Central Bank, but
investors use two market-derived rates that reflect the actual cost of obtaining dollars
through securities:

- **Dolar MEP (Mercado Electrónico de Pagos):** Also known as "dolar bolsa." You buy a
  bond in ARS, then sell the same bond denominated in USD, both on the local exchange.
  The resulting implicit exchange rate is the MEP. The dollars stay in Argentina.

- **Dolar CCL (Contado con Liquidación):** Similar to MEP, but the USD leg settles
  abroad. You buy a stock/bond locally in ARS, then sell its ADR counterpart on a US
  exchange in USD. The CCL rate reflects the cost of moving dollars out of the country.
  The CCL is typically higher than the MEP because it includes the "externalization premium."

### GET /live/mep

Returns the MEP exchange rate calculated through every CEDEAR and bond pair available.

```bash
curl -s https://data912.com/live/mep | python3 -m json.tool
```

**Response fields:**

| Field     | Meaning                                                              |
|-----------|----------------------------------------------------------------------|
| `ticker`  | Instrument used for the calculation (e.g., AAPL, AL30)               |
| `bid`     | MEP exchange rate derived from the best bid prices                   |
| `ask`     | MEP exchange rate derived from the best ask prices                   |
| `close`   | MEP rate at the last trade price                                     |
| `mark`    | Midpoint estimate (average of bid and ask)                           |
| `v_ars`   | Volume traded in ARS (local leg)                                     |
| `v_usd`   | Volume traded in USD (dollar leg)                                    |
| `q_ars`   | Number of operations on the ARS leg                                  |
| `q_usd`   | Number of operations on the USD leg                                  |
| `ars_bid` | Best bid price for the ARS-denominated instrument                    |
| `ars_ask` | Best ask price for the ARS-denominated instrument                    |
| `usd_bid` | Best bid price for the USD-denominated instrument                    |
| `usd_ask` | Best ask price for the USD-denominated instrument                    |
| `panel`   | Source panel: `cedear`, `bond`, etc.                                 |

**Why this matters:** Each row is a separate MEP calculation through a different instrument.
The "real" MEP is typically quoted using the most liquid bond (AL30) or high-volume CEDEARs.
Having all instruments lets you spot arbitrage: if AAPL's implied MEP is 1407 but MSFT's
is 1430, there may be a momentary mispricing in one of them.

### GET /live/ccl

Returns the CCL exchange rate calculated through every dual-listed stock (Argentine stock
+ its US ADR counterpart).

```bash
curl -s https://data912.com/live/ccl | python3 -m json.tool
```

**Response fields:**

| Field         | Meaning                                                         |
|---------------|-----------------------------------------------------------------|
| `ticker_usa`  | US-listed ticker (ADR symbol, e.g., YPF, GGAL)                 |
| `ticker_ar`   | Argentine-listed ticker (e.g., YPFD, GGAL)                     |
| `CCL_bid`     | CCL rate from best bid prices on both sides                     |
| `CCL_ask`     | CCL rate from best ask prices on both sides                     |
| `CCL_close`   | CCL rate from last trade prices                                 |
| `CCL_mark`    | Midpoint CCL estimate                                           |
| `ars_volume`  | Total ARS volume traded in the Argentine leg                    |
| `volume_rank` | Rank by volume (1 = most liquid pair)                           |
| `arg_panel`   | Panel type on BYMA (usually `stock`)                            |
| `usa_panel`   | Panel type on US exchange (usually `adr`)                       |

**Why this matters:** The CCL is the most important rate for anyone transferring capital
out of Argentina. The `volume_rank` field is key: low-volume pairs can have wildly
distorted CCL values. Stick to rank 1-10 for reliable quotes. In our test, the top
pairs (YPF, GGAL, BBAR) showed CCL values of ~1460-1478, consistent with market
reports of ~1470.

---

## 2. Argentine Equities

### GET /live/arg_stocks

Real-time order book snapshot for all stocks listed on BYMA (Bolsas y Mercados Argentinos).

```bash
curl -s https://data912.com/live/arg_stocks | python3 -m json.tool
```

**Response fields (Panel schema):**

| Field        | Meaning                                                          |
|--------------|------------------------------------------------------------------|
| `symbol`     | BYMA ticker (e.g., GGAL, YPFD, ALUA)                            |
| `px_bid`     | Best bid price (in ARS)                                          |
| `q_bid`      | Quantity at best bid                                             |
| `px_ask`     | Best ask price (in ARS)                                          |
| `q_ask`      | Quantity at best ask                                             |
| `c`          | Last trade price                                                 |
| `v`          | Total volume (quantity of shares traded today)                   |
| `q_op`       | Number of individual operations/trades today                     |
| `pct_change` | Percentage change from previous close                            |

**Suffix convention:** Tickers ending in `D` (e.g., ALUAD) are the USD-denominated
version of the same stock, settled in dollars within the local exchange. Tickers ending
in `C` are settled in cable (transfers abroad). This is how MEP and CCL work: the price
ratio between ALUA (ARS) and ALUAD (USD) gives you the implied MEP rate.

---

## 3. CEDEARs (Argentine Depositary Receipts)

### GET /live/arg_cedears

Real-time data for CEDEARs traded on BYMA.

```bash
curl -s https://data912.com/live/arg_cedears | python3 -m json.tool
```

**What is a CEDEAR?** A CEDEAR is an Argentine certificate representing shares of a
foreign company. Each CEDEAR maps to a fraction of the underlying stock (the "ratio").
For example, 10 AAPL CEDEARs = 1 Apple share on NASDAQ. CEDEARs trade in ARS on BYMA,
so their price embeds the implicit exchange rate: if Apple trades at $254 and the MEP
is 1420, one AAPL CEDEAR should cost approximately 254 * 1420 / 10 = ARS 36,068. Any
deviation creates arbitrage opportunities.

Response uses the same **Panel schema** as Argentine stocks. Tickers follow the same
suffix convention: `AAPL` is the ARS version, `AAPLC` is the cable (CCL) version,
`AAPLD` is the USD (MEP) version.

**Coverage:** 200+ CEDEARs including all major US tech, banks, commodities, and even
ETFs (SPY, QQQ, DIA, EWZ, EEM, XLE, XLF, IWM, ARKK).

---

## 4. Argentine Options

### GET /live/arg_options

Real-time data for equity options listed on BYMA.

```bash
curl -s https://data912.com/live/arg_options | python3 -m json.tool
```

Response uses the same **Panel schema**. The ticker encodes the option details:

- Example: `ALUC1000JU` = ALUA (underlying), C (Call), 1000 (strike), JU (June expiry)
- `GFGV6200AB` = GGAL (old ticker GFG), V (Put/Venta), 6200 (strike), AB (April)

The month codes follow the Argentine convention: `FE`=Feb, `MA`=Mar, `AB`=Apr, `MY`=May,
`JU`=Jun, `JL`=Jul, `AG`=Aug, `SE`=Sep, `OC`=Oct, `NO`=Nov, `DI`=Dec.

**Liquidity note:** Most Argentine options are very illiquid. Wide bid-ask spreads are
common. Only a handful of underlyings (GGAL, ALUA, YPFD, PAMP) have meaningful volume.

---

## 5. Argentine Government Bonds

### GET /live/arg_bonds

Real-time order book for sovereign bonds traded on BYMA.

```bash
curl -s https://data912.com/live/arg_bonds | python3 -m json.tool
```

Response uses the **Panel schema**. Key tickers:

| Ticker  | What it is                                                              |
|---------|-------------------------------------------------------------------------|
| `AL30`  | Bonar 2030, USD-linked, step-up coupon. Most liquid Argentine bond.     |
| `AL30D` | Same bond, settled in USD (used for MEP calculation).                   |
| `AL30C` | Same bond, settled in cable (used for CCL calculation).                 |
| `GD30`  | Global 2030, NY law. Same maturity, different jurisdiction.             |
| `GD30D` | Global 2030, USD settlement.                                           |
| `AE38`  | Bonar 2038, longer duration.                                           |
| `AL35`  | Bonar 2035.                                                            |
| `AL41`  | Bonar 2041.                                                            |

**The suffix pattern:** No suffix = ARS, `D` = USD (local), `C` = Cable (abroad).
This is the same convention as stocks and CEDEARs.

**Prices:** Bonds like AL30 trade around ARS 87,000-88,000. Their `D` counterparts
trade around USD 60-62. The ratio (87,400 / 61.2 ~ 1,428) gives the implied MEP rate.

---

## 6. Argentine Government Notes (Letras)

### GET /live/arg_notes

Short-term government securities (Letras del Tesoro, LECAPs, etc.).

```bash
curl -s https://data912.com/live/arg_notes | python3 -m json.tool
```

Response uses the **Panel schema**. Ticker examples:

| Ticker   | What it is                                                            |
|----------|-----------------------------------------------------------------------|
| `S30A6`  | LECAP maturing April 30, 2026. Short-term peso-denominated note.     |
| `T2X5`   | CER-adjusted (inflation-linked) treasury note.                       |
| `D30A6`  | Dollar-linked LEDE (Letra del Tesoro).                               |
| `BU4J6`  | Bono del Tesoro (Treasury Bond) with specific maturity.               |

These instruments are critical for the Argentine fixed-income market: LECAPs set the
short-term peso rate, CER-linked notes reflect inflation expectations, and dollar-linked
notes embed devaluation expectations.

---

## 7. Argentine Corporate Debt

### GET /live/arg_corp

Corporate bonds (Obligaciones Negociables) traded on BYMA.

```bash
curl -s https://data912.com/live/arg_corp | python3 -m json.tool
```

Response uses the **Panel schema**. Tickers follow issuer codes:

- `AERBD`, `AERBO` = Aeropuertos Argentina bonds (D = USD settlement, O = ARS)
- `AFCHD` = AFCH (company ticker) + D (USD)

Corporate bonds in Argentina are typically USD-denominated, with the `D` suffix being
the USD-settled version. ARS-priced versions are used by local investors who want
exposure without dollars.

---

## 8. US ADRs

### GET /live/usa_adrs

Real-time data for Argentine ADRs listed on US exchanges (NYSE/NASDAQ).

```bash
curl -s https://data912.com/live/usa_adrs | python3 -m json.tool
```

Response uses the **Panel schema** with USD prices. Key ADRs:

| Symbol | Company                        | Exchange |
|--------|--------------------------------|----------|
| GGAL   | Grupo Financiero Galicia       | NASDAQ   |
| YPF    | YPF S.A. (energy)              | NYSE     |
| BBAR   | BBVA Argentina                 | NYSE     |
| BMA    | Banco Macro                    | NYSE     |
| CEPU   | Central Puerto (energy)        | NYSE     |
| SUPV   | Grupo Supervielle (banking)    | NYSE     |
| LOMA   | Loma Negra (cement)            | NYSE     |
| CRESY  | Cresud (agriculture)           | NASDAQ   |
| TEO    | Telecom Argentina              | NYSE     |
| PAM    | Pampa Energía                  | NYSE     |

These are the counterpart tickers used for CCL calculations. The price in USD here,
divided into the ARS price of the same stock on BYMA, gives the CCL rate.

---

## 9. US Stocks

### GET /live/usa_stocks

Broad US equity market data.

```bash
curl -s https://data912.com/live/usa_stocks | python3 -m json.tool
```

Response uses the **Panel schema** with USD prices. Coverage appears to include thousands
of US-listed stocks beyond just the Argentine-related ADRs. This makes the API useful
as a general-purpose US stock data source as well.

---

## 10. Historical OHLC Data

Three endpoints provide daily OHLC (Open-High-Low-Close) candles with additional analytics.

### GET /historical/stocks/{ticker}

Argentine stock historical data. History goes back to 2001 for major tickers.

```bash
curl -s https://data912.com/historical/stocks/GGAL | python3 -m json.tool
```

### GET /historical/cedears/{ticker}

CEDEAR historical data in ARS.

```bash
curl -s https://data912.com/historical/cedears/AAPL | python3 -m json.tool
```

### GET /historical/bonds/{ticker}

Argentine bond historical data.

```bash
curl -s https://data912.com/historical/bonds/AL30 | python3 -m json.tool
```

**Response fields (HistoricalBar schema):**

| Field  | Meaning                                                                 |
|--------|-------------------------------------------------------------------------|
| `date` | Trading date (YYYY-MM-DD)                                               |
| `o`    | Open price                                                              |
| `h`    | High price                                                              |
| `l`    | Low price                                                               |
| `c`    | Close price                                                             |
| `v`    | Volume                                                                  |
| `dr`   | Daily return (decimal, e.g., 0.0177 = +1.77%)                          |
| `sa`   | Annualized standard deviation (rolling historical volatility, decimal)  |

**The `sa` field is notable.** Most free APIs give you raw OHLCV and leave you to compute
volatility yourself. Here, `sa` is pre-calculated as the annualized standard deviation of
returns (rolling window), which saves work for anyone building risk models or options
pricing. In our test, GGAL showed `sa` of ~0.48 in 2001 (Argentine crisis period) and
~0.30 in March 2026 (calmer times), which is directionally correct.

**Data depth:** GGAL history starts from 2001-01-02. AL30 has data from its issuance
onward, with the latest entry being today's date. The data updates daily.

---

## 11. US Volatility Analytics (EOD)

### GET /eod/volatilities/{ticker}

End-of-day volatility surface analytics for US stocks. This is one of the most
differentiated features of the API.

```bash
curl -s https://data912.com/eod/volatilities/AAPL | python3 -m json.tool
```

**Response fields (VolatilityMetrics schema):**

| Field                      | Meaning                                                    |
|----------------------------|------------------------------------------------------------|
| `iv_s_term`                | Implied volatility, short-term (~30 days)                  |
| `iv_m_term`                | Implied volatility, medium-term (~60-90 days)              |
| `iv_l_term`                | Implied volatility, long-term (~180+ days)                 |
| `iv_s_term_percentile`     | IV percentile rank vs. last year (0-1 scale)               |
| `iv_m_term_percentile`     | Same for medium-term                                       |
| `iv_l_term_percentile`     | Same for long-term                                         |
| `hv_s_term`                | Historical (realized) volatility, short-term               |
| `hv_m_term`                | Historical volatility, medium-term                         |
| `hv_l_term`                | Historical volatility, long-term                           |
| `hv_s_term_percentile`     | HV percentile rank vs. last year                           |
| `hv_m_term_percentile`     | Same for medium-term                                       |
| `hv_l_term_percentile`     | Same for long-term                                         |
| `iv_hv_s_ratio`            | Short-term IV / HV ratio                                   |
| `iv_hv_s_ratio_percentile` | Percentile of that ratio vs. history                       |
| `iv_hv_m_ratio`            | Medium-term IV / HV ratio                                  |
| `iv_hv_m_ratio_percentile` | Percentile of that ratio                                   |
| `iv_hv_l_ratio`            | Long-term IV / HV ratio                                    |
| `iv_hv_l_ratio_percentile` | Percentile of that ratio                                   |
| `fair_iv`                  | Model-estimated "fair" implied volatility (beta)           |
| `fair_iv_percentile`       | Percentile of fair IV                                      |
| `iv_fair_iv_ratio`         | Actual IV / Fair IV ratio (>1 = options seem expensive)    |
| `iv_fair_iv_ratio_percentile` | Percentile of that ratio                                |

### How to read these numbers

**Implied Volatility (IV):** The market's forecast of future price movement, derived from
option prices. Higher IV = options are more expensive = market expects bigger moves.

**Historical Volatility (HV):** The actual realized volatility over a past period.

**IV Percentile:** If `iv_s_term_percentile` = 0.164, that means current short-term IV
is higher than only 16.4% of the readings over the past year. IV is relatively low.

**IV/HV Ratio:** Compares what the market expects (IV) vs. what actually happened (HV).
- Ratio > 1.0: Options are pricing in more volatility than has been realized. Options
  may be "expensive." Consider selling premium (covered calls, credit spreads).
- Ratio < 1.0: Options are pricing in less volatility than realized. Options may be
  "cheap." Consider buying premium (long calls/puts, debit spreads).

**Fair IV (beta):** An experimental model-estimated IV based on the stock's beta and
market conditions. The `iv_fair_iv_ratio` tells you whether options are expensive or
cheap relative to what the model thinks is fair.

### Example interpretation (AAPL, March 18, 2026)

```
iv_s_term: 0.231          -> Short-term IV is 23.1%
hv_s_term: 0.239          -> Realized vol is 23.9%
iv_hv_s_ratio: 0.967      -> IV slightly below HV (options priced a touch cheap)
iv_s_term_percentile: 0.16 -> IV is in the 16th percentile (low for the year)
fair_iv: 0.219             -> Model thinks fair IV is 21.9%
iv_fair_iv_ratio: 1.10     -> Actual IV is 10% above fair value
```

Reading: AAPL options are historically cheap (low percentile), pricing slightly below
realized vol (ratio < 1), but slightly expensive vs. the model's fair value. Mixed
signal - no strong directional trade on vol alone.

---

## 12. US Option Chains (EOD)

### GET /eod/option_chain/{ticker}

End-of-day option chain with full Greeks and proprietary analytics. Coverage: 5,000+
US underlyings.

```bash
curl -s https://data912.com/eod/option_chain/AAPL | python3 -m json.tool
```

**Response fields:**

| Field        | Meaning                                                             |
|--------------|---------------------------------------------------------------------|
| `opex`       | Option expiration date (YYYY-MM-DD)                                 |
| `s_symbol`   | Underlying stock symbol                                             |
| `type`       | `call` or `put`                                                     |
| `k`          | Strike price                                                        |
| `oi`         | Open interest (number of outstanding contracts)                     |
| `c`          | Last trade price of the option                                      |
| `iv`         | Implied volatility of this specific contract                        |
| `bid`        | Best bid price                                                      |
| `ask`        | Best ask price                                                      |
| `delta`      | Delta (sensitivity to $1 move in underlying)                        |
| `gamma`      | Gamma (rate of change of delta)                                     |
| `theta`      | Theta (time decay per day, negative for long positions)             |
| `vega`       | Vega (sensitivity to 1% change in IV)                               |
| `rho`        | Rho (sensitivity to interest rate changes)                          |
| `fair_value` | Model-estimated fair price (beta, experimental)                     |
| `itm_prob`   | Probability of expiring in-the-money                                |
| `otm`        | Out-of-the-money amount (negative = ITM)                            |
| `intrinsic`  | Intrinsic value (max(0, S-K) for calls, max(0, K-S) for puts)      |
| `fair_iv`    | Model-estimated fair implied volatility (beta)                      |
| `r_days`     | Calendar days remaining until expiration                            |
| `r_tdays`    | Trading days remaining until expiration                             |
| `hv_2m`      | 2-month historical volatility of the underlying                     |
| `hv_1yr`     | 1-year historical volatility of the underlying                      |

### Notable proprietary fields

- **`fair_value`** and **`fair_iv`**: These are the API's own model outputs. If `fair_value`
  is significantly different from the market mid-price, the model sees a mispricing.
  Similarly, if `fair_iv` differs from `iv`, the model disagrees with the market's vol
  estimate for that specific contract.

- **`itm_prob`**: Pre-calculated probability of expiring ITM. This saves you from having
  to build your own probability model. Deep ITM options show values near 1.0 (e.g.,
  AAPL $220 call = 0.999), while OTM options show lower values.

- **`hv_2m` and `hv_1yr`**: Having these on every row means you can instantly compare
  each contract's IV against realized vol without a separate API call.

---

## 13. Data Accuracy Cross-Check

We compared Data912 values against independently sourced data on March 18, 2026.

### MEP Exchange Rate

| Source           | Bid        | Ask        |
|------------------|------------|------------|
| Data912 (AAPL)   | ARS 1,407  | ARS 1,433  |
| Data912 (ABBV)   | ARS 1,396  | ARS 1,453  |
| Market consensus | ARS 1,370  | ARS 1,420  |

The values from individual CEDEARs vary because each has different liquidity. The range
overlaps with market consensus. Highly liquid instruments (AL30, AAPL, GGAL) will be
closest to the "true" MEP.

### CCL Exchange Rate

| Source                | Bid        | Ask        |
|-----------------------|------------|------------|
| Data912 (YPF/YPFD)   | ARS 1,460  | ARS 1,478  |
| Data912 (GGAL/GGAL)  | ARS 1,462  | ARS 1,466  |
| Ambito.com            | ARS 1,470  | ARS 1,472  |

The CCL values from top-volume pairs (YPF, GGAL) closely match the reference. The narrow
bid-ask on GGAL (1462-1466) aligns with its #3 volume rank.

### GGAL Stock (BYMA, ARS)

| Source     | Bid        | Ask        |
|------------|------------|------------|
| Data912    | ARS 6,355  | ~ARS 6,370 |
| Yahoo (BA) | ARS 6,345  | ARS 6,350  |

Very close match. The small difference reflects the ~20-second refresh delay.

### AAPL Stock (NASDAQ, USD)

| Source   | Price      |
|----------|------------|
| Data912 option chain implied | ~$254 (underlying for option pricing) |
| Market (Investing.com)       | $249.94 close, $254.23 prev close    |

The option chain data (dated March 20 expiry, 2 days out) uses the previous close as
reference, which matches the $254.23 figure.

### AAPL Volatility

| Metric          | Data912  | Expectation                          |
|-----------------|----------|--------------------------------------|
| IV short-term   | 23.1%    | Reasonable for a mega-cap stock      |
| HV short-term   | 23.9%    | Consistent with recent AAPL moves    |
| HV 1-year       | 31.7%    | Matches the 52-week range volatility |

All values are within expected ranges for AAPL in a moderate-volatility market.

### Verdict

The data is **accurate and usable**. Deviations from reference sources are small and
explainable by refresh timing. For a free, no-auth API, the quality is high — especially
the volatility analytics and option chain data with Greeks, which are hard to find
elsewhere without registration.

---

## Quick Reference: All Endpoints

| Method | Endpoint                        | Data                               | Auth | Rate   |
|--------|---------------------------------|------------------------------------|------|--------|
| GET    | `/live/mep`                     | MEP rates per instrument           | None | 120/m  |
| GET    | `/live/ccl`                     | CCL rates per dual-listed pair     | None | 120/m  |
| GET    | `/live/arg_stocks`              | Argentine stocks (BYMA)            | None | 120/m  |
| GET    | `/live/arg_cedears`             | CEDEARs on BYMA                    | None | 120/m  |
| GET    | `/live/arg_options`             | Argentine equity options           | None | 120/m  |
| GET    | `/live/arg_bonds`               | Argentine sovereign bonds          | None | 120/m  |
| GET    | `/live/arg_notes`               | Gov notes / LECAPs / LEDEs         | None | 120/m  |
| GET    | `/live/arg_corp`                | Corporate bonds (ONs)              | None | 120/m  |
| GET    | `/live/usa_adrs`                | Argentine ADRs (US exchanges)      | None | 120/m  |
| GET    | `/live/usa_stocks`              | US stocks (broad market)           | None | 120/m  |
| GET    | `/historical/stocks/{ticker}`   | Argentine stock OHLCV + vol        | None | 120/m  |
| GET    | `/historical/cedears/{ticker}`  | CEDEAR OHLCV + vol                 | None | 120/m  |
| GET    | `/historical/bonds/{ticker}`    | Bond OHLCV + vol                   | None | 120/m  |
| GET    | `/eod/volatilities/{ticker}`    | US stock vol surface analytics     | None | 120/m  |
| GET    | `/eod/option_chain/{ticker}`    | US option chain + Greeks           | None | 120/m  |
| POST   | `/contact`                      | Contact form                       | None | 1/m    |

---

## 14. The Fundamentals Gap (Solved)

Data912 provides **zero fundamentals data**: no earnings, revenue, balance sheets, P/E
ratios, dividends, or financial statements. Everything it offers is price/volume/volatility.

To build a complete picture, we need a complementary source. We found one that is also
free and requires no authentication: **finance-query.com**. It covers both US and
Argentine stocks.

### Best Option: finance-query.com (No Auth, Open Source, Self-Hostable)

**GitHub:** [Verdenroz/finance-query](https://github.com/Verdenroz/finance-query)
**License:** MIT | **Auth:** None | **Sources:** Yahoo Finance + SEC EDGAR

This is a Rust-based API with REST, GraphQL, and WebSocket interfaces. It requires no
API key and can be self-hosted via Docker. The hosted version at `finance-query.com` is
free to use.

**Crucially, it supports Argentine stocks via the `.BA` suffix** (Buenos Aires exchange).
We verified GGAL.BA, YPFD.BA, and ALUA.BA — all return full financial statements and
quote-level fundamentals. The data comes from Yahoo Finance, which sources it from the
companies' filings with the CNV (Argentina's securities regulator).

#### Full Financial Statements via GraphQL

Works for both US tickers (`AAPL`) and Argentine tickers (`GGAL.BA`, `YPFD.BA`, `ALUA.BA`).
Annual data, multiple years:

```bash
# Income Statement — US stock
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { financials(statement: INCOME) } }"}' \
  | python3 -m json.tool

# Income Statement — Argentine stock
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"GGAL.BA\") { financials(statement: INCOME) } }"}' \
  | python3 -m json.tool

# Balance Sheet — Argentine stock
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"YPFD.BA\") { financials(statement: BALANCE) } }"}' \
  | python3 -m json.tool

# Cash Flow Statement
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"ALUA.BA\") { financials(statement: CASH_FLOW) } }"}' \
  | python3 -m json.tool
```

**What you get (verified for both US and Argentine stocks):**

| Statement    | Sample Fields                                                            |
|--------------|--------------------------------------------------------------------------|
| Income       | TotalRevenue, CostOfRevenue, GrossProfit, EBIT, EBITDA, NetIncome, EPS  |
| Balance      | TotalAssets, CurrentAssets, Cash, AccountsReceivable, TotalLiabilities, Equity |
| Cash Flow    | OperatingCashFlow, CapitalExpenditure, FreeCashFlow, Dividends Paid      |

Data goes back 4 years (annual). Fields use XBRL taxonomy names.

**Argentine stocks verified:**

| Ticker    | Company                  | Income | Balance | Cash Flow | Quote Ratios |
|-----------|--------------------------|--------|---------|-----------|--------------|
| GGAL.BA   | Grupo Financiero Galicia | Yes    | Yes     | Yes       | Yes          |
| YPFD.BA   | YPF S.A.                 | Yes    | Yes     | Yes       | Yes          |
| ALUA.BA   | Aluar Aluminio           | Yes    | Yes     | Yes       | Yes          |

Note: Argentine financial data is in ARS and reflects inflation-adjusted figures (NIIF).
The large numbers (trillions of ARS) are normal given Argentina's inflation history.

#### Quote-Level Fundamentals (REST)

```bash
# US stock
curl -s "https://finance-query.com/v2/quotes?symbols=AAPL" | python3 -m json.tool

# Argentine stocks (use .BA suffix)
curl -s "https://finance-query.com/v2/quotes?symbols=GGAL.BA,YPFD.BA,ALUA.BA" | python3 -m json.tool
```

Returns embedded fundamental metrics alongside price data:

| Field                        | Example Value  | What It Is                          |
|------------------------------|----------------|-------------------------------------|
| `trailingEps`                | 7.91           | EPS (trailing 12 months)            |
| `forwardEps`                 | 9.32           | EPS (analyst consensus forward)     |
| `priceToBook`                | 41.67          | Price / Book Value                  |
| `bookValue`                  | 5.998          | Book value per share                |
| `earningsQuarterlyGrowth`    | 0.159          | YoY quarterly earnings growth (15.9%) |
| `marketCap`                  | 3,673B         | Market capitalization               |
| `dividendYield`              | 0.41%          | Annual dividend yield               |
| `fiftyTwoWeekHigh/Low`       | 288.62 / 169.21| 52-week range                       |
| `sharesOutstanding`          | 14.68B         | Total shares outstanding            |

#### Dividends & Splits History

```bash
curl -s "https://finance-query.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ticker(symbol: \"AAPL\") { dividends splits } }"}' \
  | python3 -m json.tool
```

Returns full dividend history with CAGR analytics, plus all historical stock splits.

#### Cross-Check: finance-query vs. Known Data (AAPL, March 18, 2026)

| Metric              | finance-query   | Apple Q1 2026 Report | Match? |
|---------------------|-----------------|----------------------|--------|
| FY2025 Revenue      | ~$416.2B        | $416.2B              | Yes    |
| FY2025 Net Income   | ~$112.0B        | $112.0B (reported)   | Yes    |
| Book Value/Share    | $5.998          | Market reports ~$6   | Yes    |
| Earnings Growth     | 15.9% QoQ       | Apple reported +16%  | Yes    |

The data matches public filings. Source is SEC EDGAR, so it's authoritative.

### Recommended Stack

For a complete free setup with **no API keys needed**:

| Need                           | Source                                  |
|--------------------------------|-----------------------------------------|
| Argentine prices (live)        | Data912 `/live/*`                       |
| Argentine historical OHLCV     | Data912 `/historical/*`                 |
| US volatility analytics        | Data912 `/eod/volatilities/*`           |
| US option chains + Greeks      | Data912 `/eod/option_chain/*`           |
| MEP / CCL exchange rates       | Data912 `/live/mep`, `/live/ccl`        |
| Financial statements (US)      | finance-query.com (GraphQL, `AAPL`)     |
| Financial statements (ARG)     | finance-query.com (GraphQL, `GGAL.BA`)  |
| Key ratios & EPS (US + ARG)    | finance-query.com (REST quotes)         |
| Dividends & splits history     | finance-query.com (GraphQL)             |

Both are free, require no authentication, and return clean JSON. Together they cover
price data, derivatives analytics, and fundamentals — for both US and Argentine stocks.

### Background: "Milton Casco Data Center Inc."

The API provider name is a joke — [Milton Casco](https://en.wikipedia.org/wiki/Milton_Casco)
is a famous Argentine football (soccer) player for River Plate. The API appears to be a
side project by an Argentine developer. It was referenced by [@nacho_java on X](https://x.com/nacho_java/status/1921654025486819596)
in the context of a "Python para Finanzas + IA" course, suggesting it has a small but
real user community in the Argentine fintech/quantitative finance education space.

---

## Limitations

- **No fundamentals in Data912:** No earnings, revenue, balance sheets, P/E, or financial
  statements. Solved by pairing with finance-query.com — see
  [Section 14](#14-the-fundamentals-gap-solved).
- **Not real-time:** The API explicitly states this. Data refreshes every ~20 seconds with
  a 2-hour Cloudflare cache. For scalping or HFT, this is not suitable. For EOD analysis,
  portfolio tracking, or educational use, it is more than adequate.
- **No websocket/streaming:** Polling only. Respect the 120 req/min limit.
- **No authentication = no SLA:** There are no uptime guarantees. The service could go
  down or change without notice.
- **Argentine options data is raw:** No Greeks or IV calculations for Argentine options
  (unlike the US option chain endpoint). You get order book data only.
- **Historical data coverage:** Only Argentine stocks, CEDEARs, and bonds have historical
  endpoints. There is no historical endpoint for US stocks, US options, or exchange rates.
- **Fair value / fair IV are beta:** The model behind these fields is undocumented. Use
  them as a signal, not as ground truth.
