const STORAGE_KEY = 'argpt_holdings';
const SCHEMA_VERSION = 2;

const Storage = {
  getHoldings() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data.version !== SCHEMA_VERSION) return this._migrate(data);
    return data.holdings || [];
  },

  saveHoldings(holdings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: SCHEMA_VERSION,
      holdings
    }));
  },

  addHolding(h) {
    const holdings = this.getHoldings();
    holdings.push(h);
    this.saveHoldings(holdings);
  },

  removeHolding(index) {
    const holdings = this.getHoldings();
    holdings.splice(index, 1);
    this.saveHoldings(holdings);
  },

  updateHolding(index, h) {
    const holdings = this.getHoldings();
    holdings[index] = h;
    this.saveHoldings(holdings);
  },

  _migrate(data) {
    if (!data.version || data.version < 2) {
      const holdings = (data.holdings || []).map(h => ({
        ...h,
        entry_fx_rate: h.entry_fx_rate || null
      }));
      this.saveHoldings(holdings);
      return holdings;
    }
    return data.holdings || [];
  }
};
