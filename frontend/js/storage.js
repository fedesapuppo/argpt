const STORAGE_KEY = 'argpt_holdings';
const SCHEMA_VERSION = 3;

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

  mergeHoldings(newHoldings, broker) {
    const existing = this.getHoldings().filter(h => h.broker && h.broker !== broker);
    this.saveHoldings(existing.concat(newHoldings));
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

  isEmpty() {
    return !localStorage.getItem(STORAGE_KEY);
  },

  async loadFromJson() {
    if (!this.isEmpty()) return false;
    try {
      const resp = await fetch('data/holdings.json');
      if (!resp.ok) return false;
      const holdings = await resp.json();
      this.saveHoldings(holdings);
      return true;
    } catch { return false; }
  },

  _migrate(data) {
    const holdings = (data.holdings || []).map(h => ({
      ...h,
      entry_fx_rate: h.entry_fx_rate || null,
      broker: h.broker || (h.type === 'us_stock' ? 'ib' : 'balanz')
    }));
    this.saveHoldings(holdings);
    return holdings;
  }
};
