const App = {
  data: { prices: null, exchangeRates: null, technicals: null, fundamentals: null },

  async init() {
    Toast.init();
    I18n.init();
    Tabs.init();
    Filter.init();
    Form.init();
    Import.init();
    Export.init();
    ColumnHelp.init();

    await Storage.loadFromJson();
    if (Storage.isEmpty()) {
      Storage.saveHoldings(Import._sampleHoldings());
      this._sampleMode = true;
    }
    await this.loadData();
    document.getElementById('loading-overlay').classList.add('hidden');
    this.refresh();
    this._updateSampleBanner();
  },

  async loadData() {
    const fallback = await this._loadStaticFallback();

    // Bulk prices + exchange rates from data912, with fallback to static JSON.
    const bulk = await LiveData.loadBulk(fallback).catch(() => fallback);
    this.data = {
      exchangeRates: bulk.exchangeRates || fallback.exchangeRates || null,
      prices: bulk.prices || fallback.prices || {},
      technicals: fallback.technicals || {},
      fundamentals: fallback.fundamentals || {}
    };

    this._updateLastUpdated();

    // Kick off analytics for the current holdings in the background.
    // refresh() will be called again once they arrive.
    this._loadAnalyticsForCurrentHoldings(fallback);
  },

  async _loadStaticFallback() {
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
    return { exchangeRates, prices, technicals, fundamentals };
  },

  async _loadAnalyticsForCurrentHoldings(fallback) {
    const holdings = Storage.getHoldings();
    if (!holdings.length) return;
    try {
      const { fundamentals, technicals } = await LiveData.loadAnalytics(holdings, {
        fundamentals: fallback.fundamentals,
        technicals: fallback.technicals
      });
      this.data.fundamentals = fundamentals;
      this.data.technicals = technicals;
      this.refresh();
    } catch (e) {
      console.warn('[App] analytics load failed', e);
    }
  },

  // Called after a user adds/imports a new ticker — fetches its analytics
  // so the fundamentals/technicals tabs populate without a reload.
  async fetchForHoldings(newHoldings) {
    if (!newHoldings?.length) return;
    try {
      const { fundamentals, technicals } = await LiveData.loadAnalytics(newHoldings, {
        fundamentals: this.data.fundamentals,
        technicals: this.data.technicals
      });
      this.data.fundamentals = fundamentals;
      this.data.technicals = technicals;
      this.refresh();
    } catch (e) {
      console.warn('[App] on-demand fetch failed', e);
    }
  },

  _updateLastUpdated() {
    const rates = this.data.exchangeRates;
    if (!rates?.fetched_at) return;
    const d = new Date(rates.fetched_at);
    const el = document.getElementById('last-updated');
    if (el) el.textContent = I18n.t('updated', { date: d.toLocaleString() });
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
    Chart.render(result.holdings);
    Table.renderPortfolio(result, fundamentals);

    const warning = document.getElementById('fx-warning');
    warning.classList.toggle('hidden', !result.has_estimated_fx);

    Technicals.render(technicals, prices, holdings, exchangeRates?.mep, fundamentals);
    Fundamentals.render(fundamentals, holdings);
    this._updateSampleBanner();
  },

  _updateSampleBanner() {
    const banner = document.getElementById('sample-banner');
    if (!banner) return;
    banner.classList.toggle('hidden', !this._sampleMode);
  },

  _updateSummary(result) {
    const el = (id) => document.getElementById(id);

    el('total-usd').textContent = Currency.formatUSD(result.total_value_usd);

    const totalCostUsd = result.total_value_usd - result.total_pnl_usd;
    const totalPnlPct = totalCostUsd > 0 ? (result.total_pnl_usd / totalCostUsd) * 100 : 0;
    const pnlUsdEl = el('total-pnl-usd');
    pnlUsdEl.textContent = `${Currency.formatUSD(result.total_pnl_usd)} (${Currency.formatPct(totalPnlPct)})`;
    pnlUsdEl.className = `text-2xl font-mono font-semibold tabular-nums ${Currency.pctClass(result.total_pnl_usd)}`;

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
