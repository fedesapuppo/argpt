# ARGPT Currency Conversion & USD Return Rules

## Purpose

This document is the authoritative reference for how ARGPT calculates **real USD returns** for Argentine investors who buy assets with pesos. Every formula, field, and edge case in `Argpt::Portfolio::Calculator` must conform to this spec.

The core problem: an Argentine investor buys assets with ARS. To know their **real USD return**, you need to know (a) how many implicit USD they spent at purchase time, and (b) how many USD they'd get if they liquidated today. The difference between these is the true dollar return — which incorporates both asset price movement AND exchange rate movement.

---

## The Three Asset Flows

### 1. CEDEAR (type: `:cedear`)

**What it is:** A certificate traded on BYMA (Buenos Aires exchange) in ARS that represents a fraction of a US stock. The CEDEAR price in ARS embeds the CCL (contado con liquidación) rate implicitly.

**How the investor buys:** Pays ARS on BYMA.

**How the investor liquidates to USD:** Sells CEDEAR for ARS on BYMA → buys a dual-listed bond (e.g., AL30) in ARS → sells that bond in USD (MEP operation). This is the legal, standard path to dollars.

**Current valuation (today's USD value per share):**
```
current_value_usd = cedear_ars_price / current_mep_rate
```

**Entry cost basis (USD per share at purchase):**
```
cost_basis_usd = purchase_ars_price / mep_rate_at_purchase
```

**USD return:**
```
total_return_usd_pct = (current_value_usd / cost_basis_usd) - 1
total_return_usd     = (current_value_usd - cost_basis_usd) * shares
```

**Important nuance:** The CEDEAR ARS price is NOT simply `us_stock_price * ccl_rate * ratio`. It's close, but there's a premium/discount driven by local supply/demand. Using the actual CEDEAR ARS price divided by MEP (rather than the underlying US stock price) reflects what the investor would actually receive in dollars via the MEP route. This is a feature, not a bug.

**Optional metric — CEDEAR premium/discount:**
```
implied_ccl = cedear_ars_price / (us_stock_usd_price * ratio)
cedear_premium_pct = (implied_ccl / current_ccl_rate) - 1
```
This tells the investor how much extra (or less) they're paying for the CEDEAR vs buying the stock directly in the US. Positive = premium, negative = discount. Display this as informational only.

### 2. Argentine Stock (type: `:arg_stock`)

**What it is:** A stock traded on BYMA in ARS (e.g., GGAL, YPF.BA, ALUA).

**How the investor buys:** Pays ARS on BYMA.

**How the investor liquidates to USD:** Same as CEDEAR — sells for ARS → MEP operation to get dollars.

**Current valuation:**
```
current_value_usd = arg_stock_ars_price / current_mep_rate
```

**Entry cost basis:**
```
cost_basis_usd = purchase_ars_price / mep_rate_at_purchase
```

**USD return:** Same formulas as CEDEAR.

**Note:** Some Argentine stocks also have ADRs trading in the US (e.g., GGAL has an ADR). The ADR price in USD is NOT the same as the implied USD value via MEP, because the ADR price embeds the CCL rate. For ARGPT V1, we value arg_stocks via MEP only. The ADR comparison could be a V2 feature.

### 3. US Stock (type: `:us_stock`)

**What it is:** A stock traded on NYSE/NASDAQ in USD (e.g., AAPL, MSFT).

**How the investor buys:** There are two paths:
- **Path A — had USD already:** Bought directly with dollars. Cost basis is simply the USD purchase price.
- **Path B — converted from ARS via CCL:** Sold ARS via contado con liquidación to get USD in a US brokerage, then bought the stock. Effective USD cost = ARS spent per share / CCL rate at purchase time.

**Current valuation:**
```
current_value_usd = us_stock_usd_price  (directly, no conversion needed)
current_value_ars = us_stock_usd_price * current_ccl_rate  (for ARS display)
```

**Entry cost basis:**
```
# Path A: already had USD
cost_basis_usd = purchase_usd_price

# Path B: converted via CCL
cost_basis_usd = purchase_ars_spent_per_share / ccl_rate_at_purchase
# which simplifies to: purchase_usd_price (the price they paid in USD after conversion)
```

**Key insight:** For US stocks, if the user enters their `avg_price` in USD and they already had dollars, the cost basis is straightforward. If they converted from ARS, the CCL rate at conversion time already determined their USD cost — once they have dollars and buy the stock, the cost basis in USD is just the USD price they paid. So for V1, `avg_price` for US stocks is always in USD and represents the actual USD cost. No FX conversion needed for entry.

**USD return:**
```
total_return_usd_pct = (current_value_usd / cost_basis_usd) - 1
total_return_usd     = (current_value_usd - cost_basis_usd) * shares
```

---

## Return Decomposition

For every holding, compute and expose three return components:

### 1. Capital Return (asset price movement in native currency)
```
# For ARS assets (cedear, arg_stock):
capital_return_pct = (current_ars_price / purchase_ars_price) - 1

# For USD assets (us_stock):
capital_return_pct = (current_usd_price / purchase_usd_price) - 1
```

### 2. Currency Return (exchange rate movement)
```
# For ARS assets — MEP change:
currency_return_pct = (mep_rate_at_purchase / current_mep_rate) - 1
# Note: inverted because a HIGHER MEP means the peso WEAKENED,
# so existing ARS assets are worth FEWER dollars.
# Wait — actually: if MEP goes UP (more ARS per USD), then
# ars_price / higher_mep = FEWER USD. But the investor's ARS asset
# price likely went up too (peso devaluation pushes ARS prices up).
# The decomposition captures this correctly because:
# total_usd_return = (1 + capital_return) * (1 + currency_return) - 1

# Correct formula for currency return on ARS→USD conversion:
currency_return_pct = (mep_rate_at_purchase / current_mep_rate) - 1
# When MEP rises (peso weakens): currency_return is NEGATIVE
# (your ARS buys fewer USD now)
# When MEP falls (peso strengthens): currency_return is POSITIVE
# (your ARS buys more USD now)

# For USD assets: currency_return_pct = 0 (already in USD)
```

### 3. Total USD Return (combined)
```
total_return_usd_pct = (1 + capital_return_pct) * (1 + currency_return_pct) - 1
```

**Verification:** `total_return_usd_pct` must equal `(current_value_usd / cost_basis_usd) - 1`. If it doesn't, there's a bug. Use this as a test assertion.

### Why decomposition matters

An investor who bought GGAL at ARS 2,000 when MEP was 1,000 (cost = USD 2.00) and now GGAL is ARS 4,200 with MEP at 1,400 (value = USD 3.00):
- Capital return: +110% (ARS price doubled+)
- Currency return: -28.6% (peso weakened, 1000/1400 - 1)
- Total USD return: +50% (3.00/2.00 - 1)
- Verification: (1 + 1.10) * (1 + (-0.286)) - 1 = 2.10 * 0.714 - 1 ≈ 0.50 ✓

Without decomposition, the investor just sees "+50% in USD" and doesn't understand that the stock *crushed it* in pesos but the devaluation ate more than half the gains. This is the key insight ARGPT provides.

---

## Data Model: Holding

```ruby
Argpt::Portfolio::Holding = Data.define(
  :ticker,          # String — "AAPL", "GGAL", "KOD" (CEDEAR ticker)
  :type,            # Symbol — :cedear, :arg_stock, :us_stock
  :shares,          # BigDecimal — number of shares/CEDEARs held
  :avg_price,       # BigDecimal — average purchase price in NATIVE currency
                    #   cedear/arg_stock → ARS
                    #   us_stock → USD
  :buy_date,        # Date or nil — approximate purchase date (for display/sorting)
  :entry_fx_rate,   # BigDecimal or nil — MEP rate for cedear/arg_stock,
                    #   not used for us_stock
                    #   This is ARS-per-USD at time of purchase
                    #   If nil, Calculator uses current rate as fallback (with warning flag)
)
```

**Why `entry_fx_rate` and not `cost_basis_usd`:**
- For ARS assets, `cost_basis_usd` is derived: `avg_price / entry_fx_rate`. Having the rate separately lets us compute the decomposition (capital vs currency return).
- For US stocks, `entry_fx_rate` is nil and `cost_basis_usd = avg_price` directly.
- If the user doesn't know their entry MEP rate, we fall back to current MEP but flag `fx_rate_estimated: true` on the result so the UI can show a warning.

**Future evolution (V2):** Replace single Holding with a `Trade` log where each trade has its own date, price, shares, and fx_rate. The Holding becomes a computed aggregate. Design the Calculator to accept cost_basis_usd as input so this transition is seamless.

---

## Data Model: Calculator Output

Per-holding result hash:

```ruby
{
  ticker: "GGAL",
  type: :arg_stock,
  shares: 100,

  # Current valuation
  current_price_native: 4200.0,       # ARS for cedear/arg_stock, USD for us_stock
  current_price_usd: 3.0,
  current_price_ars: 4200.0,
  current_value_usd: 300.0,           # shares * current_price_usd
  current_value_ars: 420000.0,        # shares * current_price_ars

  # Cost basis
  cost_basis_usd: 2.0,                # avg_price / entry_fx_rate (or avg_price for us_stock)
  cost_basis_ars: 2000.0,             # avg_price for ARS assets, avg_price * entry_ccl for us_stock
  total_cost_usd: 200.0,              # shares * cost_basis_usd
  total_cost_ars: 200000.0,

  # Returns
  capital_return_pct: 1.10,            # +110% in native currency
  currency_return_pct: -0.286,         # MEP moved against (or 0 for us_stock)
  total_return_usd_pct: 0.50,          # +50% in USD
  total_return_usd: 100.0,             # dollar P&L
  total_return_ars_pct: 1.10,          # +110% in ARS (same as capital return for ARS assets)
  total_return_ars: 220000.0,

  # Daily change
  daily_change_pct: 0.015,             # from price data

  # Portfolio weight (filled in by portfolio-level calculation)
  weight_pct: nil,

  # Flags
  fx_rate_estimated: false,            # true if entry_fx_rate was nil and we used current rate
}
```

Portfolio-level result:

```ruby
{
  total_value_usd: 5000.0,
  total_value_ars: 7000000.0,
  total_cost_usd: 4000.0,
  total_pnl_usd: 1000.0,
  total_pnl_ars: ...,                  # computed using CCL for USD positions
  total_return_usd_pct: 0.25,          # portfolio-level USD return
  daily_change_pct: ...,               # weighted average of holdings' daily changes
  holdings: [/* per-holding results with weight_pct filled in */],

  # Metadata
  mep_rate: { mark: 1400.0, source: "AL30 CI", bid: 1395.0, ask: 1405.0 },
  ccl_rate: { mark: 1450.0, source: "GD30 48hs", bid: 1445.0, ask: 1455.0 },
  has_estimated_fx: true,              # true if ANY holding has fx_rate_estimated
}
```

---

## Exchange Rate Selection

### MEP Rate (for ARS → USD conversion)

Used for: current valuation of cedear and arg_stock positions.

Selection logic:
1. From Data912 `/live/mep` response, get all bond pairs
2. Prefer AL30 (most liquid, tightest spread) in "contado inmediato" (CI) settlement
3. Use `mark` value (midpoint of bid/ask)
4. If AL30 CI not available, fall back to GD30 CI, then AL30 48hs
5. Return rate object with: `{ mark:, bid:, ask:, source: "AL30 CI" }`

### CCL Rate (for USD → ARS conversion)

Used for: displaying US stock values in ARS.

Selection logic:
1. From Data912 `/live/ccl` response, get all ADR pairs
2. Use the pair with `volume_rank: 1` (most liquid)
3. Use `mark` value
4. Return rate object with source info

### Historical Rates for Entry Cost Basis

**This is the hardest part.** Options in priority order:

1. **User provides `entry_fx_rate` directly.** Best option — user knows what rate they got. Use it.

2. **Look up historical MEP from ArgentinaDatos API.** Free, public API:
   ```
   GET https://argentinadatos.com/v1/cotizaciones/dolares/bolsa/{YYYY/MM/DD}
   ```
   Returns `{ compra, venta, fecha }` for dólar bolsa (MEP) on that date. Use the average of compra/venta as the historical MEP rate. Available from ~October 2018 onwards. This could be used as a helper/suggestion when the user enters a `buy_date` but no `entry_fx_rate`.

3. **Fallback: use current MEP rate.** If no entry rate is available, use today's MEP. This UNDERSTATES gains when the peso has weakened (which is almost always). Flag with `fx_rate_estimated: true` so the UI shows a clear warning like: "⚠ Entry exchange rate unknown — USD return is approximate. Enter your MEP rate at purchase for accuracy."

**For V1:** Support options 1 and 3. Option 2 (automatic historical lookup) is a nice-to-have for V2 or Epic 4. The frontend form should have a field for entry_fx_rate with helpful placeholder text.

---

## Edge Cases

### Zero or nil prices
If current price is 0 or nil for a holding, skip it in portfolio calculations. Don't divide by zero. Flag it as `price_unavailable: true`.

### MEP rate of 0 or nil
Abort calculation entirely. MEP is required for all ARS→USD conversions. Raise or return an error.

### Holdings with no entry_fx_rate and no buy_date
Use current MEP as fallback. Flag it. These holdings will show 0% currency return (which is technically correct given the assumption that they were bought at today's rate).

### CEDEAR ratio changes
CEDEAR ratios can change (stock splits etc). This affects the number of CEDEARs the investor holds, not the calculation logic. The user should update their shares count. Calculator doesn't need to handle this — it's a data input concern.

### Mixed portfolio weights
Weight calculation:
```
weight_pct = holding_current_value_usd / portfolio_total_value_usd
```
All weights must sum to 1.0 (within floating point tolerance).

### Very old purchases (pre-2018)
Historical MEP data from ArgentinaDatos only goes back to ~Oct 2018. Before that, the MEP mechanism existed but data is scarce. Users with older positions must enter `entry_fx_rate` manually or accept the estimated fallback.

### Post-cepo convergence (2025+)
Since April 2025, official/MEP/CCL rates have largely converged (~1430-1460 range as of early 2026). For purchases made after convergence, the choice between MEP and CCL matters less. But the model should still use MEP for ARS→USD and CCL for USD→ARS, because they can diverge again and the spread, even if small, is real money on large positions.

---

## What ARGPT Does That Other Trackers Don't

1. **Uses MEP/CCL rates, not official rates.** Sharesight and Portseido use official FX rates (from Open Exchange Rates or similar). For Argentina pre-2025, the official rate was 50-80% below the market rate. Those tools would show wildly inflated USD returns for ARS-denominated assets. ARGPT uses the rates the investor actually gets.

2. **Decomposes capital vs currency return.** Most trackers show a single total return. ARGPT shows: "your stock went up 110% in pesos, but the peso lost 28% against the dollar, so your real dollar gain is 50%." This is the insight Argentine investors need.

3. **Handles the CEDEAR→MEP liquidation path.** We value CEDEARs at `ARS price / MEP` rather than using the underlying US stock price. This reflects the actual dollars you'd receive by selling the CEDEAR and doing a MEP operation — which may differ from the underlying stock price due to the CEDEAR premium/discount.

---

## Test Cases for Calculator

### Test 1: Simple CEDEAR purchase
```
Input:
  holding: { ticker: "AAPL_D", type: :cedear, shares: 100, avg_price: 5000.0, entry_fx_rate: 1000.0 }
  current_prices: { "AAPL_D" => { price: 7000.0, currency: :ars, pct_change: 0.02 } }
  mep_rate: 1400.0

Expected:
  cost_basis_usd: 5.0      (5000 / 1000)
  current_value_usd: 5.0    (7000 / 1400)
  capital_return_pct: 0.40   (7000/5000 - 1 = +40% in ARS)
  currency_return_pct: -0.2857  (1000/1400 - 1 = -28.57%)
  total_return_usd_pct: 0.0  (5.0/5.0 - 1 = 0%)
  # The stock went up 40% in pesos but the peso lost ~29%: net zero in USD
  # Verification: (1.40) * (0.7143) - 1 ≈ 0.0 ✓
```

### Test 2: Argentine stock with big peso devaluation
```
Input:
  holding: { ticker: "GGAL", type: :arg_stock, shares: 50, avg_price: 2000.0, entry_fx_rate: 800.0 }
  current_prices: { "GGAL" => { price: 5600.0, currency: :ars, pct_change: -0.01 } }
  mep_rate: 1400.0

Expected:
  cost_basis_usd: 2.5       (2000 / 800)
  current_value_usd: 4.0     (5600 / 1400)
  capital_return_pct: 1.80    (+180% in ARS)
  currency_return_pct: -0.4286 (800/1400 - 1)
  total_return_usd_pct: 0.60  (4.0/2.5 - 1 = +60%)
  total_return_usd: 75.0     (50 * (4.0 - 2.5))
  # Verification: (2.80) * (0.5714) - 1 ≈ 0.60 ✓
```

### Test 3: US stock (no FX conversion needed)
```
Input:
  holding: { ticker: "AAPL", type: :us_stock, shares: 10, avg_price: 150.0, entry_fx_rate: nil }
  current_prices: { "AAPL" => { price: 180.0, currency: :usd, pct_change: 0.005 } }
  ccl_rate: 1450.0

Expected:
  cost_basis_usd: 150.0
  current_value_usd: 180.0
  capital_return_pct: 0.20    (+20%)
  currency_return_pct: 0.0
  total_return_usd_pct: 0.20  (+20%)
  current_value_ars: 261000.0  (180 * 1450)
  fx_rate_estimated: false
```

### Test 4: Missing entry_fx_rate (fallback to current MEP)
```
Input:
  holding: { ticker: "ALUA", type: :arg_stock, shares: 200, avg_price: 1500.0, entry_fx_rate: nil }
  current_prices: { "ALUA" => { price: 2100.0, currency: :ars } }
  mep_rate: 1400.0

Expected:
  cost_basis_usd: 1.0714     (1500 / 1400 — using current MEP as fallback)
  current_value_usd: 1.50     (2100 / 1400)
  currency_return_pct: 0.0    (same rate used for entry and exit)
  total_return_usd_pct: 0.40  (just the capital return)
  fx_rate_estimated: true     ← UI must warn user
```

### Test 5: Portfolio-level aggregation
```
Input: holdings from tests 2 + 3 above

Expected:
  total_value_usd: 200.0 + 1800.0 = 2000.0  (50*4.0 + 10*180)
  total_cost_usd: 125.0 + 1500.0 = 1625.0   (50*2.5 + 10*150)
  total_pnl_usd: 375.0
  total_return_usd_pct: 0.2308  (375/1625)
  GGAL weight: 200/2000 = 10%
  AAPL weight: 1800/2000 = 90%
```