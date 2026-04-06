import HttpApi from './http.js';

const QUOTE_FIELDS = `
  regularMarketPrice regularMarketChange regularMarketChangePercent
  trailingEps forwardEps priceToBook
  returnOnEquity profitMargins operatingMargins
  debtToEquity dividendYield earningsGrowth
  fiftyTwoWeekHigh fiftyTwoWeekLow
  sector industry shortName marketCap
`.trim();

const BATCH_CHUNK_SIZE = 20;

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
    const query = `{ ticker(symbol: "${symbol}") { quote { ${QUOTE_FIELDS} } } }`;
    const res = await HttpApi.postJson(`${this.BASE}/graphql`, { query });
    return res?.data?.ticker?.quote || null;
  },

  // Batch GraphQL quotes using aliases. Chunks into groups to avoid payload limits.
  // Returns { "AAPL": {quote}, "GOOGL": {quote}, ... }
  async batchQuotes(symbols) {
    if (!symbols.length) return {};
    const chunks = this._chunk(symbols, BATCH_CHUNK_SIZE);
    const results = await Promise.all(chunks.map(chunk => this._batchQuoteChunk(chunk)));
    return Object.assign({}, ...results);
  },

  async _batchQuoteChunk(symbols) {
    const aliases = symbols.map((s, i) => `t${i}: ticker(symbol: "${s}") { quote { ${QUOTE_FIELDS} } }`);
    const query = `{ ${aliases.join('\n')} }`;
    const res = await HttpApi.postJson(`${this.BASE}/graphql`, { query, timeout: 30000 });
    const data = res?.data || {};
    const out = {};
    symbols.forEach((s, i) => {
      const quote = data[`t${i}`]?.quote;
      if (quote) out[s] = quote;
    });
    return out;
  },

  async indicators(symbol, { interval = 'ONE_DAY', range = 'THREE_MONTHS' } = {}) {
    const query = `{ ticker(symbol: "${symbol}") { indicators(interval: "${interval}", range: "${range}") } }`;
    const res = await HttpApi.postJson(`${this.BASE}/graphql`, { query });
    return res?.data?.ticker?.indicators || null;
  },

  // Batch GraphQL indicators using aliases. Chunks into groups.
  // Returns { "AAPL": {indicators}, "GOOGL": {indicators}, ... }
  async batchIndicators(symbols, { interval = 'ONE_DAY', range = 'THREE_MONTHS' } = {}) {
    if (!symbols.length) return {};
    const chunks = this._chunk(symbols, BATCH_CHUNK_SIZE);
    const results = await Promise.all(chunks.map(chunk => this._batchIndicatorChunk(chunk, interval, range)));
    return Object.assign({}, ...results);
  },

  async _batchIndicatorChunk(symbols, interval, range) {
    const aliases = symbols.map((s, i) =>
      `t${i}: ticker(symbol: "${s}") { indicators(interval: "${interval}", range: "${range}") }`
    );
    const query = `{ ${aliases.join('\n')} }`;
    const res = await HttpApi.postJson(`${this.BASE}/graphql`, { query, timeout: 30000 });
    const data = res?.data || {};
    const out = {};
    symbols.forEach((s, i) => {
      const ind = data[`t${i}`]?.indicators;
      if (ind) out[s] = ind;
    });
    return out;
  },

  _chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
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
