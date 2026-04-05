// Alpine is imported from its ESM build so that we control when Alpine.start()
// runs — specifically, AFTER Alpine.data('dashboard', ...) has been registered.
// The auto-start CDN build races the module graph and fires start() before
// app.js has finished evaluating, which leaves x-data="dashboard" unresolved.
import Alpine from './vendor/alpine.esm.min.js';
import Toast from './toast.js';
import I18n from './i18n.js';
import Filter from './filter.js';
import Form from './form.js';
import Import from './import.js';
import ColumnHelp from './column-help.js';
import Storage from './storage.js';
import LiveData from './api/live_data.js';
import Cache from './cache.js';
import Portfolio from './portfolio.js';
import Chart from './chart.js';
import Table from './table.js';
import Technicals from './technicals.js';
import Fundamentals from './fundamentals.js';
import Currency from './currency.js';

// Reference to the mounted Alpine "dashboard" component. Populated by the
// component's init() hook so App can flip reactive flags (loading, sampleMode)
// without touching the DOM directly.
let dashboard = null;

const App = {
  data: { prices: null, exchangeRates: null, technicals: null, fundamentals: null },
  AUTO_REFRESH_MS: 3 * 60 * 60 * 1000,
  _autoRefreshTimer: null,

  async init() {
    Toast.init();
    I18n.init();
    Form.init();
    Import.init();
    ColumnHelp.init();

    await Storage.loadFromJson();
    if (Storage.isEmpty()) {
      Storage.saveHoldings(Import._sampleHoldings());
      if (dashboard) dashboard.sampleMode = true;
    }
    await this.loadData();
    if (dashboard) dashboard.loading = false;
    this.refresh();
    this._scheduleAutoRefresh();
  },

  async loadData() {
    const fallback = await this._loadStaticFallback();

    // Seed with fallback so the first render has data immediately.
    this.data = {
      exchangeRates: fallback.exchangeRates || null,
      prices: fallback.prices || {},
      technicals: fallback.technicals || {},
      fundamentals: fallback.fundamentals || {}
    };

    // Bulk prices + analytics run in parallel — neither depends on the other.
    const bulkPromise = LiveData.loadBulk(fallback).catch(() => fallback);
    this._loadAnalyticsForCurrentHoldings(fallback);

    const bulk = await bulkPromise;
    this.data.exchangeRates = bulk.exchangeRates || fallback.exchangeRates || null;
    this.data.prices = bulk.prices || fallback.prices || {};
    this._updateLastUpdated();
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
  // so the fundamentals/technicals tabs populate without a reload. Also
  // counts as a manual refresh, resetting the auto-refresh timer.
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
      this._scheduleAutoRefresh();
    } catch (e) {
      console.warn('[App] on-demand fetch failed', e);
    }
  },

  // (Re)schedules the auto-refresh timer. Called on init and on every manual
  // refresh — so while the user is active, the 3h timer never fires.
  _scheduleAutoRefresh() {
    if (this._autoRefreshTimer) clearTimeout(this._autoRefreshTimer);
    this._autoRefreshTimer = setTimeout(() => this.autoRefresh(), this.AUTO_REFRESH_MS);
  },

  // Forces a full reload of prices, rates, fundamentals, and technicals,
  // bypassing the cache. Reschedules the 3h timer afterwards.
  async autoRefresh() {
    try {
      Cache.clearAll();
      const fallback = await this._loadStaticFallback();
      const bulk = await LiveData.loadBulk(fallback).catch(() => fallback);
      this.data.exchangeRates = bulk.exchangeRates || fallback.exchangeRates || null;
      this.data.prices = bulk.prices || fallback.prices || {};
      this._updateLastUpdated();
      this.refresh();
      await this._loadAnalyticsForCurrentHoldings(fallback);
    } catch (e) {
      console.warn('[App] auto-refresh failed', e);
    } finally {
      this._scheduleAutoRefresh();
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

  // Flips the sample-mode flag on the Alpine dashboard component. Used by
  // import.js after a user loads real data or clears all holdings.
  setSampleMode(value) {
    if (dashboard) dashboard.sampleMode = value;
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

// Alpine component factory. Holds the shell UI state — tabs, filter, loading,
// sampleMode, language. The table renderers stay imperative (innerHTML) so
// Alpine never owns their subtrees.
function dashboardFactory() {
  const initialHash = window.location.hash.replace('#', '');
  const initialTab = ['portfolio', 'technicals', 'fundamentals', 'glossary'].includes(initialHash)
    ? initialHash
    : 'portfolio';

  return {
    activeTab: initialTab,
    filter: 'all',
    loading: true,
    sampleMode: false,

    init() {
      dashboard = this;
    },

    selectTab(tab) {
      this.activeTab = tab;
      window.location.hash = tab;
    },

    setFilter(f) {
      this.filter = f;
      Filter._current = f;
      App.refresh();
    },

    toggleLang() {
      I18n.setLang(I18n.lang() === 'es' ? 'en' : 'es');
      location.reload();
    }
  };
}

// Register the component, then start Alpine. Because we imported the ESM
// (manual-start) build of Alpine, nothing runs until we call Alpine.start().
// This guarantees Alpine.data('dashboard', ...) is registered before any DOM
// scanning happens.
Alpine.data('dashboard', dashboardFactory);
window.Alpine = Alpine; // expose for debugging from DevTools
Alpine.start();

export default App;

// Module scripts are always deferred — by the time this runs, DOMContentLoaded
// has either fired or is about to. Handle both cases so init never misses.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
