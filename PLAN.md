# ARGPT — Argentine Portfolio Tracker

## Context

Build a free, serverless portfolio tracker for Argentine investors. Inspired by Danelfin's portfolio view but without the 5-stock limit. Tracks CEDEARs, Argentine stocks, and US stocks with dual-currency display (ARS + USD). No paid services — everything free.

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

### CEDEAR USD Valuation
- CEDEAR ARS price / MEP rate (not underlying US stock price)
- Rationale: in practice, you sell CEDEAR for ARS, buy bond, sell bond for USD via MEP

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
│       └── finance-api/SKILL.md         # NEW: API query patterns
├── lib/
│   ├── argpt.rb                         # Require tree + Argpt module
│   ├── http_client.rb                   # HTTParty wrapper with rate limiting + cache
│   ├── data_sources/
│   │   ├── data912.rb                   # Data912 API client
│   │   └── finance_query.rb             # finance-query.com (REST + GraphQL)
│   ├── portfolio/
│   │   ├── holding.rb                   # Value object: ticker, type, shares, avg_price, buy_date
│   │   ├── calculator.rb               # P&L, weights, daily change, currency conversion
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
│   │   ├── storage.js                   # localStorage for holdings
│   │   ├── portfolio.js                 # Portfolio calculations (mirrors Ruby)
│   │   ├── currency.js                  # MEP/CCL conversion + formatters
│   │   ├── tabs.js                      # Tab switching
│   │   ├── form.js                      # Add/edit/delete holdings
│   │   └── table.js                     # Table rendering + sorting
│   └── data/                            # Output from Ruby scripts (gitignored except samples)
│       ├── prices.json
│       ├── exchange_rates.json
│       ├── technicals.json
│       └── fundamentals.json
├── bin/
│   ├── fetch_data                       # Main pipeline: fetch all → write JSON
│   └── setup                            # bundle install
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

### Agents (in `.claude/agents/`)

1. **finance-data-fetcher** — Knows both API schemas. Can be dispatched to fetch data, capture fixtures, or validate API responses. Useful for exploration and debugging data issues.

---

## Implementation Epics

### Epic 0: Project Setup & Tooling
**Goal:** Green `bundle exec rspec` with zero tests + all skills/agents in place.

- [ ] Gemfile: httparty, rspec, webmock, rake
- [ ] `.rspec`, `spec/spec_helper.rb` (webmock config, fixture helpers)
- [ ] `.tool-versions`: ruby 3.4.2
- [ ] `.gitignore`: tmp/, frontend/data/*.json, .env
- [ ] `.claude/CLAUDE.md` with project conventions (Argpt:: namespace, no Rails, bundle exec rspec, JSON fixtures, domain language)
- [ ] Create all 5 skills + 1 agent listed above
- [ ] `lib/argpt.rb` skeleton

**Acceptance:** `bundle exec rspec` → 0 examples, 0 failures

---

### Epic 1: Data Sources (Ruby API Clients)
**Goal:** Two API clients that fetch and parse data. TDD throughout.

**`Argpt::HttpClient`** (lib/http_client.rb)
- HTTParty wrapper for JSON APIs
- Rate limiting (configurable delay between requests)
- Local file cache via `CACHE_JSON=1` env var
- Retry on transient failures

**`Argpt::DataSources::Data912`** (lib/data_sources/data912.rb)
- `#mep_rates` → GET /live/mep
- `#ccl_rates` → GET /live/ccl
- `#arg_stocks` → GET /live/arg_stocks
- `#arg_cedears` → GET /live/arg_cedears
- `#usa_stocks` → GET /live/usa_stocks
- `#historical(type, ticker)` → GET /historical/{type}/{ticker}
- Returns normalized hashes with symbol keys

**`Argpt::DataSources::FinanceQuery`** (lib/data_sources/finance_query.rb)
- `#quotes(symbols)` → GET /v2/quotes?symbols=X,Y,Z
- `#indicators(symbol, interval:, range:)` → GraphQL
- `#financials(symbol, statement:, frequency:)` → GraphQL
- `#risk(symbol, interval:, range:)` → GraphQL
- `#chart(symbol, interval:, range:)` → GraphQL
- Auto-appends `.BA` for arg_stock type tickers

**Specs:** webmock stubs with captured JSON fixtures. Test happy path + error handling.

**Acceptance:** All specs pass. Can fetch real data when run without webmock.

---

### Epic 2: Portfolio Logic (Ruby)
**Goal:** Given holdings + market data → correct portfolio metrics in USD + ARS.

**`Argpt::Portfolio::Holding`** (lib/portfolio/holding.rb)
- Value object: ticker, type (:cedear, :arg_stock, :us_stock), shares, avg_price, buy_date
- `#original_currency` → :ars for cedear/arg_stock, :usd for us_stock

**`Argpt::Portfolio::ExchangeRate`** (lib/portfolio/exchange_rate.rb)
- `#best_mep(rates_data)` → Filter bonds, prefer AL30, use `mark` value
- `#best_ccl(rates_data)` → Use volume_rank 1 pair
- Returns rate objects with bid/ask/mark + source info for disclosure

**`Argpt::Portfolio::Calculator`** (lib/portfolio/calculator.rb)
- Input: holdings array + prices hash + exchange rates
- Per-holding output: current_price_usd, current_price_ars, daily_change_pct, total_gain_loss_pct, total_gain_loss_usd, weight_pct
- Portfolio-level: total_value_usd, total_value_ars, total_pnl_usd, total_pnl_ars, daily_change_pct
- Currency conversion:
  - cedear/arg_stock: USD = ARS price / MEP
  - us_stock: ARS = USD price × CCL

**Specs:** Thorough. Test each asset type, mixed portfolio, edge cases (zero prices, missing data).

**Acceptance:** Hand-calculated test cases match Calculator output exactly.

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
**Goal:** Working portfolio view with holdings form + localStorage.

- Dark financial dashboard theme (CSS variables, distinctive typography)
- Holdings form: ticker, type (cedear/arg_stock/us_stock), shares, avg_price, buy_date
- Portfolio table: Ticker, Name, Shares, Avg Price, Current Price, Daily Change %, Gain/Loss %, Gain/Loss $, Weight %
- Portfolio summary: Total USD value, Total P&L (USD + ARS), Daily change
- MEP/CCL methodology disclosure (expandable section)
- localStorage persistence (versioned schema)
- Sortable columns
- Green/red color coding for values

**Acceptance:** Add holdings → see correct portfolio. Refresh browser → data persists.

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
Epic 0 (Setup + Skills/Agents)
  ├── Epic 1 (API Clients)
  │     ├── Epic 2 (Portfolio Logic)
  │     └── Epic 3 (Technicals/Fundamentals)
  │           └── Epic 4 (JSON Export) ← depends on 1+2+3
  │                 └── Epic 5 (Frontend Portfolio)
  │                       ├── Epic 6 (Frontend Technicals)
  │                       └── Epic 7 (Frontend Fundamentals)
  └── Epic 8 (Deploy) ← after Epic 5

Epics 2 and 3 can run in parallel after Epic 1.
```

## Verification

After each epic, run:
- `bundle exec rspec` — all tests green
- For Epic 4+: `bundle exec ruby bin/fetch_data` — produces valid JSON
- For Epic 5+: open `frontend/index.html` in browser — UI works correctly
- Final: deploy to GitHub Pages and verify it works from a different browser/device
