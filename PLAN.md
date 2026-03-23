# ARGPT — Argentine Portfolio Tracker

## Context

Build a free, serverless portfolio tracker for Argentine investors. Inspired by Danelfin's portfolio view but without the 5-stock limit. Tracks CEDEARs, Argentine stocks, and US stocks with dual-currency display (ARS + USD). No paid services — everything free.

**Core value proposition:** Show Argentine investors their **real USD return** on assets bought with pesos. Existing trackers (Sharesight, Portseido, Portfolio Performance, Ziggma) use official FX rates, which were 50-80% off market pre-2025. ARGPT uses MEP/CCL rates — the rates investors actually get — and decomposes returns into capital (asset movement) vs currency (peso devaluation) components. No other tool does this.

## Architecture

```
Ruby scripts (local) → JSON files → GitHub Pages (static frontend)
```

- **Ruby 3.4.x** for all backend logic (data fetching, calculations, JSON export)
- **Vanilla HTML/CSS/JS** frontend, no build step, deployed to GitHub Pages
- **localStorage** for visitor portfolio data (holdings entry)
- **Pre-fetched JSON only** — no live API calls from browser. You run `bin/fetch_data` to update
- Data sources: Data912 (prices, MEP/CCL, historicals) + finance-query.com (fundamentals, technicals)

### Currency Conversion Rules
- Assets in Argentina (arg_stock, cedear) → USD via **MEP** (best bond pair, contado inmediato)
- Assets outside Argentina (us_stock) → ARS via **CCL** (most liquid ADR pair)
- Primary display: single USD total value
- UI discloses methodology
- See `docs/currency-rules.md` for authoritative formulas, edge cases, and test vectors

### CEDEAR USD Valuation
- CEDEAR ARS price / MEP rate (not underlying US stock price)
- Rationale: in practice, you sell CEDEAR for ARS, buy bond, sell bond for USD via MEP
- Optional metric: CEDEAR premium/discount = `(cedear_ars / (us_stock_usd × ratio)) / ccl - 1`

### Real USD Return (core differentiator)
The main goal is showing Argentine investors their **real USD return** — not just ARS P&L.
- **Entry cost basis in USD:** For ARS assets, `avg_price / mep_rate_at_purchase`. For US stocks, `avg_price` directly (already in USD).
- **Current value in USD:** For ARS assets, `current_ars_price / current_mep`. For US stocks, `current_usd_price`.
- **Return decomposition** (3 components per holding):
  - Capital return: asset price change in native currency
  - Currency return: MEP rate change since purchase (0 for US stocks)
  - Total USD return: `(1 + capital) × (1 + currency) - 1`
- **Why this matters:** No existing tracker (Sharesight, Portseido, Portfolio Performance, Ziggma) uses MEP/CCL rates — they all use official FX, which was 50-80% off market pre-2025. ARGPT shows what the investor actually gets in dollars.

### Historical MEP Data
- **V1:** User enters `entry_fx_rate` manually on each holding. Fallback: current MEP (with UI warning).
- **V2:** Auto-suggest via ArgentinaDatos API: `GET /v1/cotizaciones/dolares/bolsa/{YYYY/MM/DD}` (free, data from ~Oct 2018).
- **Limitation:** Pre-2018 purchases require manual entry — no public historical MEP API exists for earlier dates.

---

## Project Structure

```
argpt/
├── .claude/
│   ├── CLAUDE.md                        # Project-specific instructions
│   ├── agents/
│   │   └── finance-data-fetcher.md      # Agent for API data tasks
│   └── skills/
│       ├── tdd-skill/SKILL.md           # Adapted: bundle exec rspec
│       ├── frontend/SKILL.md            # Financial dashboard aesthetic
│       ├── commit/SKILL.md              # Git conventions
│       ├── code-review/SKILL.md         # Diff review
│       ├── finance-api/SKILL.md         # API query patterns
│       └── currency-rules/SKILL.md     # USD return formulas & conversion rules
├── lib/
│   ├── argpt.rb                         # Require tree + Argpt module
│   ├── http_client.rb                   # HTTParty wrapper with rate limiting + cache
│   ├── data_sources/
│   │   ├── data912.rb                   # Data912 API client
│   │   ├── finance_query.rb             # finance-query.com (REST + GraphQL)
│   │   └── argentina_datos.rb           # ArgentinaDatos: historical MEP/CCL rates
│   ├── portfolio/
│   │   ├── holding.rb                   # Value object: ticker, type, shares, avg_price, purchase_date, purchase_fx_rate
│   │   ├── calculator.rb               # Dual P&L (ARS + real USD), weights, daily change
│   │   └── exchange_rate.rb             # MEP/CCL rate selection logic
│   ├── technicals/
│   │   └── analyzer.rb                  # Technical indicators processing
│   └── fundamentals/
│       └── analyzer.rb                  # Fundamentals + industry comparison
├── spec/
│   ├── spec_helper.rb
│   ├── fixtures/                        # Real API response snapshots for webmock
│   └── lib/                             # Mirrors lib/ structure
├── frontend/
│   ├── index.html                       # Single page, 3 tabs
│   ├── css/style.css                    # Dark financial dashboard theme
│   ├── js/
│   │   ├── app.js                       # Main orchestration
│   │   ├── storage.js                   # localStorage for holdings (schema v2: includes entry_fx_rate)
│   │   ├── portfolio.js                 # Portfolio calculations (mirrors Ruby Calculator)
│   │   ├── currency.js                  # MEP/CCL conversion, return decomposition, formatters
│   │   ├── tabs.js                      # Tab switching
│   │   ├── form.js                      # Add/edit/delete holdings (entry_fx_rate field for ARS assets)
│   │   └── table.js                     # Table rendering + sorting
│   └── data/                            # Output from Ruby scripts (gitignored except samples)
│       ├── prices.json
│       ├── exchange_rates.json
│       ├── technicals.json
│       └── fundamentals.json
├── bin/
│   ├── fetch_data                       # Main pipeline: fetch all → write JSON
│   └── setup                            # bundle install
├── docs/
│   └── currency-rules.md               # Authoritative USD return formulas & test vectors
├── Gemfile
├── .rspec
├── .gitignore
├── .tool-versions                       # ruby 3.4.2
└── .github/workflows/
    └── deploy.yml                       # GitHub Pages deployment
```

---

## Skills & Agents to Create (Epic 0)

### Skills (in `.claude/skills/`)

1. **tdd-skill** — Adapted from toolkit. Change `mise exec -- rspec` → `bundle exec rspec`. Same Red-Green-Refactor discipline.

2. **frontend** — Adapted from toolkit. Added context: financial dashboard mood (dark theme, monospaced numbers, green/red P&L, data-dense tables). Avoid generic SaaS look.

3. **commit** — Copy from toolkit as-is.

4. **code-review** — Adapted for non-Rails Ruby project.

5. **finance-api** (NEW) — Documents both API schemas:
   - Data912 endpoints, field names, ticker conventions (D/C suffixes)
   - finance-query.com GraphQL queries, REST endpoints, `.BA` suffix convention
   - Rate limits (120/min Data912)
   - Fixture capture patterns for webmock tests

6. **currency-rules** (NEW) — `docs/currency-rules.md`: Authoritative reference for USD return calculations.
   - The three asset flows (cedear, arg_stock, us_stock) with exact formulas
   - Entry cost basis in USD, return decomposition (capital/currency/total)
   - Edge cases (missing FX rate, zero prices, pre-2018 purchases)
   - Hand-calculated test vectors that Calculator specs must match
   - Competitive context (why Sharesight/Portseido don't solve this)

### Agents (in `.claude/agents/`)

1. **finance-data-fetcher** — Knows both API schemas. Can be dispatched to fetch data, capture fixtures, or validate API responses. Useful for exploration and debugging data issues.

---

## Implementation Epics

### Epic 0: Project Setup & Tooling ✓
**Goal:** Green `bundle exec rspec` with zero tests + all skills/agents in place.

- [x] Gemfile: httparty, rspec, webmock, rake
- [x] `.rspec`, `spec/spec_helper.rb` (webmock config, fixture helpers)
- [x] `.tool-versions`: ruby 3.4.2
- [x] `.gitignore`: tmp/, frontend/data/*.json, .env
- [x] `.claude/CLAUDE.md` with project conventions (Argpt:: namespace, no Rails, bundle exec rspec, JSON fixtures, domain language)
- [x] Create skills: tdd-skill, frontend, commit, code-review, finance-api, currency-rules
- [x] Create agent: finance-data-fetcher
- [x] `lib/argpt.rb` skeleton

**Status:** Complete

---

### Epic 1: Data Sources (Ruby API Clients) ✓
**Goal:** Three API clients that fetch and parse data. TDD throughout.

**`Argpt::HttpClient`** (lib/argpt/http_client.rb)
- [x] HTTParty wrapper for JSON APIs
- [x] Configurable retry on transient failures (5xx, timeouts, connection resets)
- [x] Local file cache via `CACHE_JSON=1` env var (GET and POST)
- [x] Extracted `with_cache` method, HTTP method in cache key to prevent collisions

**`Argpt::DataSources::Data912`** (lib/argpt/data_sources/data912.rb)
- [x] `#mep_rates` → GET /live/mep
- [x] `#ccl_rates` → GET /live/ccl
- [x] `#arg_stocks` → GET /live/arg_stocks
- [x] `#arg_cedears` → GET /live/arg_cedears
- [x] `#usa_stocks` → GET /live/usa_stocks
- [x] `#historical(type, ticker)` → GET /historical/{type}/{ticker}

**`Argpt::DataSources::FinanceQuery`** (lib/argpt/data_sources/finance_query.rb)
- [x] `#quotes(symbols)` → GET /v2/quotes?symbols=X,Y,Z
- [x] `#indicators(symbol, interval:, range:)` → GraphQL
- [x] `#financials(symbol, statement:, frequency:)` → GraphQL
- [x] `#risk(symbol, interval:, range:)` → GraphQL
- [x] `#chart(symbol, interval:, range:)` → GraphQL
- [x] Extracted `ticker_query` helper for DRY GraphQL methods
- [x] Input validation via `SAFE_INPUT` regex

**`Argpt::DataSources::ArgentinaDatos`** (lib/argpt/data_sources/argentina_datos.rb)
- [x] `#mep_history` → GET /v1/cotizaciones/dolares/bolsa (full history, cached)
- [x] `#ccl_history` → GET /v1/cotizaciones/dolares/contadoconliqui (full history, cached)
- [x] `#mep_on(date)` → FxRate for date, falls back to previous trading day
- [x] `#ccl_on(date)` → FxRate for date, falls back to previous trading day
- [x] `FxRate = Data.define(:date, :buy, :sell, :mark)` where mark = avg(compra, venta)

**Specs:** 36 examples — webmock stubs with JSON fixtures. Happy path + error handling + retries.

**Status:** Complete

---

### Epic 2: Portfolio Logic (Ruby) ✓
**Goal:** Given holdings + market data → correct real USD returns using MEP/CCL rates.

**`Argpt::Portfolio::Holding`** (lib/argpt/portfolio/holding.rb)
- [x] Frozen value object with keyword args
- [x] Attributes: `ticker`, `type` (:cedear/:arg_stock/:us_stock), `shares`, `avg_price` (native currency), `purchase_date`, `purchase_fx_rate` (MEP for arg_stock, CCL for cedear, nil for us_stock)
- [x] `#original_currency` → `:ars` for cedear/arg_stock, `:usd` for us_stock
- [x] Validates type (must be in VALID_TYPES) and shares (must be positive)
- [x] User can enter purchase date (auto-lookup via ArgentinaDatos) OR rate directly

**`Argpt::Portfolio::ExchangeRate`** (lib/argpt/portfolio/exchange_rate.rb)
- [x] Module with class methods `.best_mep(rates_data)` and `.best_ccl(rates_data)`
- [x] Prefers AL30, falls back to first entry
- [x] Maps Data912 keys: `buy` → `bid`, `sell` → `ask`, `rate` → `mark`
- [x] `Rate = Data.define(:ticker, :bid, :ask, :mark)`
- [x] Raises `Argpt::Error` on empty data

**`Argpt::Portfolio::Calculator`** (lib/argpt/portfolio/calculator.rb)
- [x] `Calculator.new(holdings:, prices:, mep_rate:, ccl_rate:).call → Result`
- [x] Currency conversion: cedear/arg_stock `price_usd = last / mep`, us_stock `price_ars = last × ccl`
- [x] Dual P&L per holding:
  - `pnl_ars` — nominal P&L in original currency
  - `pnl_usd` — real USD P&L using `purchase_fx_rate` (nil when rate unavailable)
  - `pnl_pct` — % gain/loss in original currency
- [x] Portfolio-level: `total_value_usd`, `total_value_ars`, `total_pnl_usd`, `total_pnl_ars`, `daily_change_pct`
- [x] Value-weighted portfolio daily change
- [x] Weights sum to 100%
- [x] Empty holdings → zero totals
- [x] Missing ticker in prices → raises `Argpt::Error`
- [x] `Result` and `HoldingResult` as `Data.define`

**Specs:** 38 examples — per-asset-type calculations, mixed portfolio, edge cases, integration test with fixture data.

- [x] Return decomposition per holding:
  - `capital_return_pct` — asset price change in native currency
  - `currency_return_pct` — FX rate change since purchase (0 for us_stock, nil when no purchase_fx_rate)
  - `total_return_usd_pct` — real USD return = `(1+capital)×(1+currency)-1`
  - Identity asserted in specs
- [x] Nil decomposition when `purchase_fx_rate` missing (capital still computed, currency/total are nil)

**Specs:** 19 calculator examples + 1 integration test. Tested with hand-calculated vectors:
- CEDEAR: 40% ARS gain + 28.57% currency loss → 0% USD return
- Arg stock: 180% ARS gain + 50% currency loss → 40% USD return
- US stock: 20% capital, 0% currency, 20% total

**Status:** Complete (78 total specs)

---

### Epic 3: Technicals & Fundamentals (Ruby)
**Goal:** Process raw API data into display-ready structures.

**`Argpt::Technicals::Analyzer`** (lib/technicals/analyzer.rb)
- Input: finance-query indicators + Data912 historical
- Output per ticker: ath, pct_below_ath, rsi14, stochastic_k/d, supertrend, sma20/50/200, bollinger bands
- ATH logic:
  - Argentine stocks: max `h` from Data912 historical (ARS)
  - CEDEARs: use underlying US stock's `fiftyTwoWeekHigh` from finance-query (no historical MEP available)
  - US stocks: `fiftyTwoWeekHigh` from finance-query

**`Argpt::Fundamentals::Analyzer`** (lib/fundamentals/analyzer.rb)
- Input: finance-query quote data
- Output per ticker: pe, forward_pe, pb, roe, eps_growth, dividend_yield, debt_to_equity, profit_margin, operating_margin, sector, industry
- V1 color thresholds (absolute, not industry-relative):
  - P/E: green < 15, yellow 15-25, red > 25
  - ROE: green > 15%, yellow 10-15%, red < 10%
  - Debt/Equity: green < 1, yellow 1-2, red > 2
  - Profit Margin: green > 20%, yellow 10-20%, red < 10%

**Acceptance:** Analyzers produce correct summaries from fixture data.

---

### Epic 4: JSON Export Pipeline
**Goal:** Single command fetches all data → writes JSON for frontend.

**`bin/fetch_data`**
1. Read holdings config (which tickers to fetch)
2. Fetch MEP/CCL rates → select best
3. Fetch live prices for all held tickers
4. Fetch technicals per ticker from finance-query
5. Fetch fundamentals per ticker from finance-query
6. Fetch historical data for ATH calculation
7. Run Calculator, Technicals::Analyzer, Fundamentals::Analyzer
8. Write to `frontend/data/`: exchange_rates.json, prices.json, technicals.json, fundamentals.json
9. Print summary to stdout

**JSON schemas:**
- `exchange_rates.json`: `{ mep: { bid, ask, mark, source }, ccl: { bid, ask, mark, source }, fetched_at }`
- `prices.json`: `{ "AAPL": { price, currency, pct_change, volume }, ... }`
- `technicals.json`: `{ "AAPL": { rsi14, pct_below_ath, ... }, ... }`
- `fundamentals.json`: `{ "AAPL": { pe, roe, pb, ... }, ... }`

**Acceptance:** `bundle exec ruby bin/fetch_data` produces valid JSON. Files are complete for all configured tickers.

---

### Epic 5: Frontend — Portfolio Tab
**Goal:** Working portfolio view with holdings form + localStorage. Shows real USD returns with capital vs currency decomposition.

- Dark financial dashboard theme (CSS variables, distinctive typography)
- Holdings form: ticker, type (cedear/arg_stock/us_stock), shares, avg_price, buy_date, **entry_fx_rate** (MEP at purchase — shown only for cedear/arg_stock types, with helper text: "MEP rate when you bought, e.g. 1200. Leave blank if unknown.")
- Portfolio table columns: Ticker, Name, Shares, Avg Price, Current Price (USD), Daily Chg %, **Capital Return %**, **Currency Return %**, **USD Return %**, USD P&L $, Weight %
  - Capital Return: green/red, shows asset performance in native currency
  - Currency Return: green/red, shows MEP impact (always 0% for US stocks)
  - USD Return: green/red, the combined real dollar return
- Portfolio summary: Total USD value, Total USD P&L, Total ARS value, Daily change %
- **⚠ Warning banner** when `has_estimated_fx: true`: "Some holdings are missing entry exchange rates — USD returns are approximate. Edit holdings to add your MEP rate at purchase for accurate results."
- MEP/CCL methodology disclosure (expandable section explaining the three asset flows and how USD return is computed)
- localStorage persistence (versioned schema — **must include entry_fx_rate in schema v2**)
- Sortable columns
- Green/red color coding for all return values

**Acceptance:** Add holdings with entry_fx_rate → see decomposed returns. Add holding without entry_fx_rate → see warning banner. Refresh browser → data persists. Decomposition identity visually verifiable (capital × currency ≈ total).

---

### Epic 6: Frontend — Technicals Tab
- Table: Ticker, Price, % Below ATH, RSI(14), Stochastic, Supertrend, SMA20/50
- Color coding: RSI < 30 green (oversold), RSI > 70 red (overbought)
- Signal summary per stock (Oversold/Neutral/Overbought)

---

### Epic 7: Frontend — Fundamentals Tab
- Table: Ticker, P/E, Forward P/E, P/B, ROE, EPS Growth, Div Yield, Debt/Equity, Profit Margin
- Color-coded thresholds (green/yellow/red per metric)

---

### Epic 8: GitHub Pages Deploy + Optional Automation
- GitHub Pages config for `frontend/` directory
- Optional: GitHub Actions workflow for scheduled `bin/fetch_data` + auto-commit

---

## Dependency Graph

```
Epic 0 (Setup + Skills/Agents) ✓
  ├── Epic 1 (API Clients: Data912, FinanceQuery, ArgentinaDatos) ✓
  │     ├── Epic 2 (Portfolio Logic) ✓
  │     └── Epic 3 (Technicals/Fundamentals)
  │           └── Epic 4 (JSON Export) ← depends on 1+2+3
  │                 └── Epic 5 (Frontend Portfolio)
  │                       ├── Epic 6 (Frontend Technicals)
  │                       └── Epic 7 (Frontend Fundamentals)
  └── Epic 8 (Deploy) ← after Epic 5

Epics 2 and 3 can run in parallel after Epic 1.
74 specs passing as of Epic 2 completion.
```

## Verification

After each epic, run:
- `bundle exec rspec` — all tests green
- For Epic 4+: `bundle exec ruby bin/fetch_data` — produces valid JSON
- For Epic 5+: open `frontend/index.html` in browser — UI works correctly
- Final: deploy to GitHub Pages and verify it works from a different browser/device
