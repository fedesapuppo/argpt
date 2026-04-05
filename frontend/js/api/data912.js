const Data912 = {
  BASE: 'https://data912.com',

  argStocks()   { return HttpApi.getJson(`${this.BASE}/live/arg_stocks`); },
  argCedears()  { return HttpApi.getJson(`${this.BASE}/live/arg_cedears`); },
  usaStocks()   { return HttpApi.getJson(`${this.BASE}/live/usa_stocks`); },
  mepRates()    { return HttpApi.getJson(`${this.BASE}/live/mep`); },
  cclRates()    { return HttpApi.getJson(`${this.BASE}/live/ccl`); },

  // Picks the preferred AL30 rate or the first available.
  _bestRate(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const entry = rows.find(r => r.ticker === 'AL30') || rows[0];
    return {
      ticker: entry.ticker,
      bid: entry.bid ?? entry.buy,
      ask: entry.ask ?? entry.sell,
      mark: entry.mark ?? entry.rate
    };
  },

  // Normalize a data912 row into the app's price shape.
  _toPrice(row, type) {
    return {
      last: row.c ?? row.last,
      change: row.pct_change ?? row.change ?? 0,
      volume: row.v ?? row.volume ?? 0,
      currency: type === 'us_stock' ? 'usd' : 'ars',
      type
    };
  },

  // Fetches the full price universe and returns a prices object keyed by
  // `TICKER:type`, matching the shape of `frontend/data/prices.json`.
  async allPrices() {
    const [argStocks, cedears, usStocks] = await Promise.all([
      this.argStocks().catch(() => []),
      this.argCedears().catch(() => []),
      this.usaStocks().catch(() => [])
    ]);

    const prices = {};
    const add = (rows, type) => {
      for (const row of rows) {
        const sym = row.symbol || row.ticker;
        if (!sym) continue;
        prices[`${sym}:${type}`] = this._toPrice(row, type);
      }
    };
    add(argStocks, 'arg_stock');
    add(cedears, 'cedear');
    add(usStocks, 'us_stock');
    return prices;
  },

  async exchangeRates() {
    const [mep, ccl] = await Promise.all([
      this.mepRates().catch(() => []),
      this.cclRates().catch(() => [])
    ]);
    return {
      mep: this._bestRate(mep),
      ccl: this._bestRate(ccl),
      fetched_at: new Date().toISOString()
    };
  }
};

if (typeof module !== 'undefined') module.exports = Data912;
