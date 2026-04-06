import Cache from '../cache.js';
import Data912 from './data912.js';
import FinanceQuery from './finance_query.js';
import FundamentalsAnalyzer from '../analyzers/fundamentals.js';
import TechnicalsAnalyzer from '../analyzers/technicals.js';

// Runtime data orchestrator. Fetches live prices/fundamentals/technicals
// from data912 + finance-query, with caching and static JSON fallback.
const LiveData = {
  PRICES_TTL: 3 * 60 * 60 * 1000,      // 3 h
  RATES_TTL:  3 * 60 * 60 * 1000,      // 3 h
  FUNDAMENTALS_TTL: 3 * 60 * 60 * 1000, // 3 h
  TECHNICALS_TTL:   3 * 60 * 60 * 1000, // 3 h

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

  // Fetches fundamentals + technicals for a list of holdings. Serves cached
  // data instantly, then batch-fetches uncached tickers via GraphQL aliases
  // (quotes + indicators in parallel). Patches ATH into technicals after both resolve.
  async loadAnalytics(holdings, fallback = {}) {
    const fundamentals = { ...(fallback.fundamentals || {}) };
    const technicals = { ...(fallback.technicals || {}) };

    const unique = this._uniqueHoldings(holdings);
    if (!unique.length) return { fundamentals, technicals };

    const uncachedFund = [];
    const uncachedTech = [];

    for (const h of unique) {
      const fundCached = Cache.get(`fund:${h.ticker}`);
      if (fundCached) { fundamentals[h.ticker] = fundCached; }
      else { uncachedFund.push(h); }

      const techCached = Cache.get(`tech:${h.ticker}`);
      if (techCached) { technicals[h.ticker] = techCached; }
      else { uncachedTech.push(h); }
    }

    const fundSymbols = uncachedFund.map(h => ({ ticker: h.ticker, symbol: FinanceQuery.fqSymbol(h.ticker, h.type) }));
    const techSymbols = uncachedTech.map(h => ({ ticker: h.ticker, symbol: FinanceQuery.fqSymbol(h.ticker, h.type) }));

    const [quotesMap, indicatorsMap] = await Promise.all([
      fundSymbols.length
        ? FinanceQuery.batchQuotes(fundSymbols.map(s => s.symbol)).catch(e => { console.warn('[LiveData] batch quotes failed', e); return {}; })
        : {},
      techSymbols.length
        ? FinanceQuery.batchIndicators(techSymbols.map(s => s.symbol)).catch(e => { console.warn('[LiveData] batch indicators failed', e); return {}; })
        : {}
    ]);

    for (const { ticker, symbol } of fundSymbols) {
      const quote = quotesMap[symbol];
      if (!quote) continue;
      const analyzed = FundamentalsAnalyzer.analyze(quote);
      if (!analyzed) continue;
      fundamentals[ticker] = analyzed;
      Cache.set(`fund:${ticker}`, analyzed, this.FUNDAMENTALS_TTL);
    }

    for (const { ticker, symbol } of techSymbols) {
      const indicators = indicatorsMap[symbol];
      if (!indicators) continue;
      const fund = fundamentals[ticker];
      const analyzed = TechnicalsAnalyzer.analyze({
        indicators,
        fiftyTwoWeekHigh: fund?.fifty_two_week_high,
        currentPrice: fund?.current_price
      });
      if (!analyzed) continue;
      technicals[ticker] = analyzed;
      Cache.set(`tech:${ticker}`, analyzed, this.TECHNICALS_TTL);
    }

    return { fundamentals, technicals };
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
    if (!fallback || !Object.keys(fallback).length) return fresh || {};
    if (!fresh || !Object.keys(fresh).length) return fallback;
    return { ...fallback, ...fresh };
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

export default LiveData;
