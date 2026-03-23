const App = {
  data: { prices: null, exchangeRates: null, technicals: null, fundamentals: null },

  async init() {
    Tabs.init();
    Form.init();

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
    Table.renderPortfolio(result);

    const warning = document.getElementById('fx-warning');
    warning.classList.toggle('hidden', !result.has_estimated_fx);

    Technicals.render(technicals, prices);
    Fundamentals.render(fundamentals);
  },

  _updateSummary(result) {
    const el = (id) => document.getElementById(id);

    el('total-usd').textContent = Currency.formatUSD(result.total_value_usd);
    el('total-ars').textContent = Currency.formatARS(result.total_value_ars);

    const pnlEl = el('total-pnl-usd');
    pnlEl.textContent = Currency.formatUSD(result.total_pnl_usd);
    pnlEl.className = `text-lg font-mono font-medium tabular-nums ${Currency.pctClass(result.total_pnl_usd)}`;

    const dailyEl = el('daily-change');
    dailyEl.textContent = Currency.formatPct(result.daily_change_pct);
    dailyEl.className = `text-lg font-mono font-medium tabular-nums ${Currency.pctClass(result.daily_change_pct)}`;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
