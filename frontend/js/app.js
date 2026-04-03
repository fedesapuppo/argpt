const App = {
  data: { prices: null, exchangeRates: null, technicals: null, fundamentals: null },

  async init() {
    Tabs.init();
    Form.init();
    Import.init();

    await Storage.loadFromJson();
    await this.loadData();
    this.refresh();
  },

  async loadData() {
    const files = ['exchange_rates', 'prices', 'technicals', 'fundamentals'];
    const results = await Promise.allSettled(
      files.map(f =>
        fetch(`data/${f}.json`)
          .then(r => r.ok ? r.json() : fetch(`data/${f}.sample.json`).then(r2 => r2.json()))
          .catch(() => fetch(`data/${f}.sample.json`).then(r => r.json()).catch(() => null))
      )
    );

    const [exchangeRates, prices, technicals, fundamentals] = results.map(r =>
      r.status === 'fulfilled' ? r.value : null
    );

    this.data = { exchangeRates, prices, technicals, fundamentals };

    if (exchangeRates?.fetched_at) {
      const d = new Date(exchangeRates.fetched_at);
      document.getElementById('last-updated').textContent = `Updated ${d.toLocaleString()}`;
    }
  },

  currentMepRate() {
    return this.data.exchangeRates?.mep?.mark || null;
  },

  refresh() {
    const holdings = Storage.getHoldings();
    const { exchangeRates, prices, technicals, fundamentals } = this.data;

    const result = Portfolio.calculate(
      holdings,
      prices || {},
      exchangeRates?.mep,
      exchangeRates?.ccl
    );

    this._updateSummary(result);
    Table.renderPortfolio(result, fundamentals);

    const warning = document.getElementById('fx-warning');
    warning.classList.toggle('hidden', !result.has_estimated_fx);

    Technicals.render(technicals, prices, holdings, exchangeRates?.mep, fundamentals);
    Fundamentals.render(fundamentals, holdings);
  },

  _updateSummary(result) {
    const el = (id) => document.getElementById(id);

    el('total-usd').textContent = Currency.formatUSD(result.total_value_usd);

    const totalCostUsd = result.total_value_usd - result.total_pnl_usd;
    const totalPnlPct = totalCostUsd > 0 ? (result.total_pnl_usd / totalCostUsd) * 100 : 0;
    const pnlUsdEl = el('total-pnl-usd');
    pnlUsdEl.textContent = `${Currency.formatUSD(result.total_pnl_usd)} (${Currency.formatPct(totalPnlPct)})`;
    pnlUsdEl.className = `text-lg font-mono font-medium tabular-nums ${Currency.pctClass(result.total_pnl_usd)}`;

    const argHoldings = result.holdings.filter(h => h.type === 'arg_stock');
    const cedHoldings = result.holdings.filter(h => h.type === 'cedear' || h.type === 'us_stock');

    const argPnl = argHoldings.reduce((s, h) => s + (h.pnl_usd || 0), 0);
    const argCost = argHoldings.reduce((s, h) => s + h.value_usd, 0) - argPnl;
    const argPct = argCost > 0 ? (argPnl / argCost) * 100 : 0;
    const argEl = el('arg-pnl-usd');
    argEl.textContent = `${Currency.formatUSD(argPnl)} (${Currency.formatPct(argPct)})`;
    argEl.className = `text-lg font-mono font-medium tabular-nums ${Currency.pctClass(argPnl)}`;

    const cedPnl = cedHoldings.reduce((s, h) => s + (h.pnl_usd || 0), 0);
    const cedCost = cedHoldings.reduce((s, h) => s + h.value_usd, 0) - cedPnl;
    const cedPct = cedCost > 0 ? (cedPnl / cedCost) * 100 : 0;
    const cedEl = el('ced-pnl-usd');
    cedEl.textContent = `${Currency.formatUSD(cedPnl)} (${Currency.formatPct(cedPct)})`;
    cedEl.className = `text-lg font-mono font-medium tabular-nums ${Currency.pctClass(cedPnl)}`;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
