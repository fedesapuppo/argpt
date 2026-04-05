import HttpApi from './http.js';

const FinanceQuery = {
  BASE: 'https://finance-query.com',

  // Batch quote endpoint — returns fundamentals-like data for many symbols at once.
  async quotes(symbols) {
    if (!symbols.length) return {};
    const url = `${this.BASE}/v2/quotes?symbols=${encodeURIComponent(symbols.join(','))}`;
    const data = await HttpApi.getJson(url, { timeout: 20000 });
    return data?.quotes || {};
  },

  // Single-ticker GraphQL call for a richer quote (used as fallback / per ticker).
  async quote(symbol) {
    const fields = `
      regularMarketPrice regularMarketChange regularMarketChangePercent
      trailingEps forwardEps priceToBook
      returnOnEquity profitMargins operatingMargins
      debtToEquity dividendYield earningsGrowth
      fiftyTwoWeekHigh fiftyTwoWeekLow
      sector industry shortName marketCap
    `.trim();
    const query = `{ ticker(symbol: "${symbol}") { quote { ${fields} } } }`;
    const res = await HttpApi.postJson(`${this.BASE}/graphql`, { query });
    return res?.data?.ticker?.quote || null;
  },

  async indicators(symbol, { interval = 'ONE_DAY', range = 'THREE_MONTHS' } = {}) {
    const query = `{ ticker(symbol: "${symbol}") { indicators(interval: "${interval}", range: "${range}") } }`;
    const res = await HttpApi.postJson(`${this.BASE}/graphql`, { query });
    return res?.data?.ticker?.indicators || null;
  },

  // Build the finance-query symbol for a ticker+type.
  // Arg stocks → `.BA` suffix; cedears → strip `.C`; us stocks → as-is.
  // Mirrors `Argpt::Pipeline::Fetch#fq_symbol`.
  fqSymbol(ticker, type) {
    const aliases = { BRKB: 'BRK-B' };
    let base = ticker.replace(/\.C$/, '');
    base = aliases[base] || base;
    return type === 'arg_stock' ? `${base}.BA` : base;
  }
};

export default FinanceQuery;
