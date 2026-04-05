// Runtime data orchestrator. Fetches live prices/fundamentals/technicals
// from data912 + finance-query, with caching and static JSON fallback.
const LiveData = {
  PRICES_TTL: 5 * 60 * 1000,           // 5 min
  RATES_TTL:  5 * 60 * 1000,           // 5 min
  FUNDAMENTALS_TTL: 60 * 60 * 1000,    // 1 h
  TECHNICALS_TTL:   60 * 60 * 1000,    // 1 h

  // Loads bulk prices + exchange rates. Merges with fallback to handle
  // empty API responses (weekends, API downtime).
  async loadBulk(fallback = {}) {
    const [prices, rates] = await Promise.all([
      Cache.fetch('prices', this.PRICES_TTL, () => Data912.allPrices()).catch(() => null),
      Cache.fetch('rates',  this.RATES_TTL,  () => Data912.exchangeRates()).catch(() => null)
    ]);

    const mergedPrices = this._preferNonEmpty(prices, fallback.prices);
    const mergedRates = this._mergeRates(rates, fallback.exchangeRates);
    return { prices: mergedPrices, exchangeRates: mergedRates };
  },

  // Fetches fundamentals + technicals for a list of holdings. Uses per-ticker
  // cache so repeat calls are cheap. Runs all fetches in parallel. Returns
  // `{ fundamentals, technicals }` merged with the provided fallbacks.
  async loadAnalytics(holdings, fallback = {}) {
    const fundamentals = { ...(fallback.fundamentals || {}) };
    const technicals = { ...(fallback.technicals || {}) };

    const unique = this._uniqueHoldings(holdings);
    if (!unique.length) return { fundamentals, technicals };

    // Fundamentals first (parallel), then technicals so they can reference
    // the freshly-fetched 52wk high / current price for the ATH calculation.
    await Promise.all(unique.map(h => this._loadFundamentalsFor(h, fundamentals)));
    await Promise.all(unique.map(h => this._loadTechnicalsFor(h, technicals, fundamentals)));

    return { fundamentals, technicals };
  },

  async _loadFundamentalsFor(holding, fundamentals) {
    const { ticker, type } = holding;
    const cached = Cache.get(`fund:${ticker}`);
    if (cached) {
      fundamentals[ticker] = cached;
      return;
    }
    try {
      const symbol = FinanceQuery.fqSymbol(ticker, type);
      const quote = await FinanceQuery.quote(symbol);
      if (!quote) return;
      const analyzed = FundamentalsAnalyzer.analyze(quote);
      if (!analyzed) return;
      fundamentals[ticker] = analyzed;
      Cache.set(`fund:${ticker}`, analyzed, this.FUNDAMENTALS_TTL);
    } catch (e) {
      console.warn(`[LiveData] fundamentals ${ticker} failed`, e);
    }
  },

  async _loadTechnicalsFor(holding, technicals, fundamentals) {
    const { ticker, type } = holding;
    const cached = Cache.get(`tech:${ticker}`);
    if (cached) {
      technicals[ticker] = cached;
      return;
    }
    try {
      const symbol = FinanceQuery.fqSymbol(ticker, type);
      const indicators = await FinanceQuery.indicators(symbol);
      if (!indicators) return;
      const fund = fundamentals[ticker];
      const analyzed = TechnicalsAnalyzer.analyze({
        indicators,
        fiftyTwoWeekHigh: fund?.fifty_two_week_high,
        currentPrice: fund?.current_price
      });
      if (!analyzed) return;
      technicals[ticker] = analyzed;
      Cache.set(`tech:${ticker}`, analyzed, this.TECHNICALS_TTL);
    } catch (e) {
      console.warn(`[LiveData] technicals ${ticker} failed`, e);
    }
  },

  _uniqueHoldings(holdings) {
    const seen = new Set();
    const out = [];
    for (const h of holdings || []) {
      if (!h.ticker || seen.has(h.ticker)) continue;
      seen.add(h.ticker);
      out.push(h);
    }
    return out;
  },

  _preferNonEmpty(fresh, fallback) {
    if (fresh && Object.keys(fresh).length > 0) return fresh;
    return fallback || {};
  },

  _mergeRates(fresh, fallback) {
    if (!fresh && !fallback) return null;
    return {
      mep: fresh?.mep || fallback?.mep || null,
      ccl: fresh?.ccl || fallback?.ccl || null,
      fetched_at: fresh?.fetched_at || fallback?.fetched_at || null
    };
  }
};

if (typeof module !== 'undefined') module.exports = LiveData;
