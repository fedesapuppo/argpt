---
name: finance-api
description: Documents Data912, finance-query.com, and ArgentinaDatos API schemas, endpoints, ticker conventions, rate limits, and fixture capture patterns. Use when working with API clients, writing webmock stubs, or debugging API responses.
---

Reference for the three data sources used in ARGPT. For full details, see
`data912_analysis.md` and `finance_query_analysis.md` in the project root.

## Data912 (`https://data912.com`)

**Auth**: None. **Rate limit**: 120 req/min. **Cache**: 2-hour Cloudflare.

### Key endpoints

| Endpoint              | Returns                                        |
|-----------------------|------------------------------------------------|
| `GET /live/mep`       | MEP rates via every CEDEAR/bond pair           |
| `GET /live/ccl`       | CCL rates via every ADR pair                   |
| `GET /live/cedears`   | All CEDEARs (ARS, USD, Cable variants)         |
| `GET /live/arg`       | Argentine equities                             |
| `GET /live/usa`       | US stocks                                      |
| `GET /live/bonds`     | Argentine government bonds                     |
| `GET /live/letras`    | Argentine government notes                     |
| `GET /live/corp`      | Argentine corporate debt                       |
| `GET /hist/{ticker}`  | Historical OHLC data                           |

### Ticker conventions

- No suffix = ARS price (e.g., `AAPL`, `GGAL`, `AL30`)
- `D` suffix = USD/MEP price (e.g., `AAPLD`, `AL30D`)
- `C` suffix = Cable/CCL price (e.g., `AAPLC`, `AL30C`)

### Historical endpoint (`GET /historical/{type}/{ticker}`)

Types: `stocks`, `cedears`, `bonds`.

**Gotchas**:
- Returns **abbreviated keys**: `o`, `h`, `l`, `c`, `v`, `dr`, `sa` (not `open`/`high`/`low`/`close`). The spec fixture `data912_historical_stocks_ggal.json` uses long names — always handle both (`entry[:close] || entry[:c]`).
- Returns `{ Error: "..." }` hash for unknown tickers instead of HTTP 404 — guard with `.is_a?(Array)` before iterating results.
- Data is sorted oldest-first.

### Common response fields

| Field    | Meaning                              |
|----------|--------------------------------------|
| `ticker` | Instrument identifier                |
| `bid`    | Best bid price                       |
| `ask`    | Best ask price                       |
| `close`  | Last trade price                     |
| `mark`   | Midpoint (bid+ask)/2                 |
| `v_ars`  | Volume in ARS                        |
| `v_usd`  | Volume in USD                        |
| `panel`  | Source panel (cedear, bond, etc.)     |

## finance-query.com

**GraphQL**: `https://finance-query.com/graphql`
**REST**: `https://finance-query.com/v2/*`
**Auth**: None. **Rate limit**: No stated limit.

### Key GraphQL queries

```graphql
# Quote with fundamentals
{ ticker(symbol: "AAPL") { quote { regularMarketPrice trailingPe forwardPe marketCap dividendYield } } }

# Financial statements
{ ticker(symbol: "GGAL.BA") { financials(statement: INCOME) } }
{ ticker(symbol: "GGAL.BA") { financials(statement: BALANCE) } }
{ ticker(symbol: "GGAL.BA") { financials(statement: CASH_FLOW) } }

# Technical indicators
{ ticker(symbol: "AAPL") { technicals { sma { fiftyDay twoHundredDay } rsi macd { macd signal histogram } } } }

# Risk metrics
{ ticker(symbol: "AAPL") { riskMetrics(range: ONE_YEAR) { sharpeRatio maxDrawdown valueAtRisk beta } } }
```

### Key REST endpoints

| Endpoint                         | Returns                          |
|----------------------------------|----------------------------------|
| `GET /v2/quotes?symbols=X,Y`    | Batch quotes (130+ fields each)  |
| `GET /v2/search?query=X`        | Ticker search                    |

### CEDEAR ratio from `shortName`

The REST `/v2/quotes` endpoint for `.BA` tickers includes the CEDEAR-to-stock ratio in `shortName`. Two formats:
- `"APPLE INC CEDEAR(REPR 1/20 SHR)"` → 1 CEDEAR = 1/20 share
- `"BOEING CO CEDEAR EACH 24 REP 1"` → 24 CEDEARs = 1 share

Parse with: `/(?:REPR\s+(\d+)\/(\d+)|EACH\s+(\d+))/i`

Note: The GraphQL `quote` for US tickers (`AAPL`) returns the US company name without ratio info. Only the `.BA` REST endpoint has it.

### Ticker conventions

- US tickers as-is: `AAPL`, `MSFT`, `GGAL` (ADR)
- Balanz uses `.C` suffix for Cable/CCL tickers (e.g., `BA.C` for Boeing). Strip `.C` before querying finance-query or Data912 — it's a broker-internal convention, not recognized by external APIs.
- Argentine tickers: `.BA` suffix — `GGAL.BA`, `YPFD.BA`, `ALUA.BA`

## ArgentinaDatos (`https://api.argentinadatos.com`)

**Auth**: None. **Rate limit**: None stated. **Redirects**: follows 301.

### Dollar exchange rates

All under `/v1/cotizaciones/dolares/`.

| Endpoint                              | Returns                                  |
|---------------------------------------|------------------------------------------|
| `GET /dolares/bolsa`                  | Full MEP history (from 2018-10-29)       |
| `GET /dolares/contadoconliqui`        | Full CCL history (from 2013-01-02)       |
| `GET /dolares/blue`                   | Blue dollar history (from 2011)          |
| `GET /dolares/oficial`                | Official rate history                    |
| `GET /dolares/cripto`                 | Crypto dollar history (from 2023-02)     |
| `GET /dolares/mayorista`              | Wholesale BCRA rate                      |
| `GET /dolares/{casa}/{YYYY}/{MM}/{DD}`| Single date lookup (returns one object)  |

Response shape: `[{ casa, compra, venta, fecha }]`
Single-date endpoint returns one object (not array).

### Macro indicators

| Endpoint                                   | Returns                              |
|--------------------------------------------|--------------------------------------|
| `GET /finanzas/indices/inflacion`          | Monthly CPI % (from 1943)           |
| `GET /finanzas/indices/inflacionInteranual`| YoY CPI % (from 1943)               |
| `GET /finanzas/indices/riesgo-pais`        | Country risk (EMBI+) history         |
| `GET /finanzas/indices/riesgo-pais/ultimo` | Latest country risk value            |
| `GET /finanzas/indices/uva`               | UVA index daily (from 2016-03)       |
| `GET /finanzas/tasas/plazoFijo`           | Current fixed-term rates by bank     |

Inflation/UVA/riesgo-pais shape: `[{ fecha, valor }]`
Plazo fijo shape: `[{ entidad, tnaClientes, tnaNoClientes }]`

### Other endpoints

| Endpoint                                    | Returns                             |
|---------------------------------------------|-------------------------------------|
| `GET /finanzas/fci/{type}/{YYYY}/{MM}/{DD}` | FCI fund NAVs by date               |
| `GET /feriados/{YYYY}`                      | Argentine holidays                  |

FCI types: `mercadoDinero`, `rentaVariable`, `rentaFija`, `rentaMixta`

### What's NOT available

No bond prices, no equity prices, no monetary policy rate. Use Data912
for instrument prices.

## Fixture Capture Patterns

When adding webmock stubs for API tests:

1. **Capture real response** (once, manually):
   ```bash
   curl -s https://data912.com/live/mep | python3 -m json.tool > spec/fixtures/data912_mep.json
   curl -sL "https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa" | python3 -m json.tool > spec/fixtures/argdatos_mep_history.json
   curl -s "https://finance-query.com/v2/quotes?symbols=AAPL" | python3 -m json.tool > spec/fixtures/fq_quote_aapl.json
   ```

2. **Trim to relevant fields** — keep only the fields your code actually uses.
   Smaller fixtures are easier to maintain and make test intent clearer.

3. **Stub in spec**:
   ```ruby
   stub_request(:get, "https://data912.com/live/mep")
     .to_return(body: load_fixture("data912_mep.json"), headers: { "Content-Type" => "application/json" })
   ```

4. **Name convention**: `{source}_{endpoint}_{qualifier}.json`
   - `data912_mep.json`, `data912_cedears.json`
   - `fq_quote_aapl.json`, `fq_financials_ggal_ba.json`
   - `argdatos_mep_history.json`, `argdatos_ccl_history.json`
