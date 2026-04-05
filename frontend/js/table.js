const Table = {
  sortState: {},

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  renderPortfolio(result, fundamentals) {
    const empty = document.getElementById('empty-state');

    if (!result.holdings.length) {
      document.getElementById('portfolio-body').innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    this._portfolioData = result.holdings;
    this._fundamentals = fundamentals || {};
    this._renderPortfolioRows(result.holdings);
    this.setupSorting('portfolio-table', this._portfolioData, (sorted) => {
      this._renderPortfolioRows(sorted);
    });
  },

  _renderPortfolioRows(holdings) {
    const tbody = document.getElementById('portfolio-body');
    const isArs = (t) => t === 'cedear' || t === 'arg_stock';
    const fund = this._fundamentals || {};
    const filtered = holdings.filter(h => Filter.matches(h.type));
    tbody.innerHTML = filtered.map(h => {
      const ratio = h.type === 'cedear' ? fund[h.ticker]?.cedear_ratio : null;
      const isEtf = this._isEtf(fund[h.ticker]);
      return `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50 cursor-pointer" data-index="${h.index}">
        <td class="py-2 px-2 text-left relative">
          <span class="text-white font-medium inline-block" style="min-width:3.25rem">${this._esc(h.ticker)}</span>
          ${this._typeBadge(h.type)}
          ${isEtf ? this._etfBadge() : ''}
          ${ratio ? '<span class="text-[10px] text-accent/60 ml-0.5">' + this._esc(ratio) + '</span>' : ''}
          <span class="tip">${this._esc(h.ticker)} · ${this._typeTip(h.type)}${isEtf ? ' · ' + I18n.t('tip.etf') : ''}${ratio ? ' · ' + I18n.t('tip.ratio', { ratio: this._esc(ratio) }) : ''}</span>
        </td>
        <td class="py-2 px-2 text-center text-xs text-muted relative">${this._brokerLabel(h.broker)}<span class="tip">${this._brokerTip(h.broker)}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(h.shares, h.shares % 1 ? 2 : 0)}<span class="tip">${I18n.t('tip.shares_held')}</span></td>
        <td class="py-2 px-2 text-right relative">${isArs(h.type) && h.avg_price > 0.01 ? Currency.formatNum(h.avg_price, 2) : '--'}<span class="tip">${isArs(h.type) ? (h.avg_price > 0.01 ? I18n.t('tip.avg_ars_price') : I18n.t('tip.free_shares')) : I18n.t('tip.us_no_ars')}</span></td>
        <td class="py-2 px-2 text-right relative">${h.cost_basis_usd != null ? Currency.formatUSD(h.cost_basis_usd) : '--'}<span class="tip">${I18n.t('tip.avg_usd_price')}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatUSD(h.current_price_usd)}<span class="tip">${isArs(h.type) ? I18n.t('tip.current_usd_mep') : I18n.t('tip.current_usd')}</span></td>

        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.capital_return_pct)}">${Currency.pctArrow(h.capital_return_pct)}${Currency.formatPct(h.capital_return_pct)}<span class="tip">${isArs(h.type) ? I18n.t('tip.price_change_ars') : I18n.t('tip.price_change_usd')}</span></td>
        <td class="py-2 px-2 text-right relative ${isArs(h.type) ? Currency.pctClass(h.currency_return_pct) : 'text-muted'}">${isArs(h.type) ? Currency.pctArrow(h.currency_return_pct) + Currency.formatPct(h.currency_return_pct) : '--'}<span class="tip">${isArs(h.type) ? I18n.t('tip.peso_movement', { from: Currency.formatNum(h.entry_fx_rate, 0) }) : I18n.t('tip.no_fx')}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.total_return_usd_pct)}">${Currency.pctArrow(h.total_return_usd_pct)}${Currency.formatPct(h.total_return_usd_pct)}<span class="tip">${I18n.t('tip.total_return_usd')}</span></td>
        <td class="py-2 px-2 text-right relative">${h.value_usd ? Currency.formatUSD(h.value_usd) : '--'}<span class="tip">${I18n.t('tip.position_value')}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.pnl_usd)}">${Currency.pctArrow(h.pnl_usd)}${h.pnl_usd != null ? Currency.formatUSD(h.pnl_usd) : '--'}<span class="tip">${I18n.t('tip.pnl_usd')}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(h.weight_pct, 2)}%<span class="tip">${I18n.t('tip.weight')}</span></td>
        <td class="py-2 px-2 text-center">
          <button class="remove-btn text-muted hover:text-loss text-xs" data-index="${h.index}">✕</button>
        </td>
      </tr>
    `}).join('');

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-btn');
      if (btn) { Form.removeHolding(parseInt(btn.dataset.index)); return; }
      const row = e.target.closest('tr[data-index]');
      if (row) Form.editHolding(parseInt(row.dataset.index));
    });
  },

  _sortBound: {},

  setupSorting(tableId, data, renderFn) {
    const table = document.getElementById(tableId);
    if (!table) return;

    this._sortData = this._sortData || {};
    this._sortData[tableId] = { data, renderFn };

    if (this._sortBound[tableId]) return;
    this._sortBound[tableId] = true;

    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.setAttribute('role', 'button');
      th.setAttribute('tabindex', '0');
      th.setAttribute('scope', 'col');
    });

    const doSort = (th) => {
      const key = th.dataset.sort;
      const state = this.sortState[tableId] || {};
      const dir = state.key === key && state.dir === 'asc' ? 'desc' : 'asc';
      this.sortState[tableId] = { key, dir };

      table.querySelectorAll('th').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');

      const current = this._sortData[tableId];
      current.data.sort((a, b) => {
        const av = a[key] ?? -Infinity;
        const bv = b[key] ?? -Infinity;
        if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return dir === 'asc' ? av - bv : bv - av;
      });

      current.renderFn(current.data);
    };

    table.querySelector('thead').addEventListener('click', (e) => {
      const th = e.target.closest('th[data-sort]');
      if (th) doSort(th);
    });

    table.querySelector('thead').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const th = e.target.closest('th[data-sort]');
      if (th) { e.preventDefault(); doSort(th); }
    });
  },

  _typeLabel(type) {
    return I18n.t('type.' + type) || type;
  },

  _typeBadge(type) {
    const base = 'font-size:10px;margin-left:4px;padding:1px 5px;border-radius:3px;display:inline-block;min-width:2.4rem;text-align:center;box-sizing:border-box;';
    if (type === 'arg_stock') {
      return `<span style="${base}background:linear-gradient(180deg,#74ACDF 30%,#fff 30%,#fff 70%,#74ACDF 70%);color:#1a4a6e;font-weight:600;">${this._typeLabel(type)}</span>`;
    }
    if (type === 'us_stock') {
      return `<span style="${base}background:#002868;color:#fff;font-weight:600;border-left:2px solid #fff;border-right:2px solid #bf0a30;">${this._typeLabel(type)}</span>`;
    }
    if (type === 'cedear') {
      return `<span style="${base}background:linear-gradient(135deg,rgba(116,172,223,0.3),rgba(139,92,246,0.3));color:#c4b5fd;">${this._typeLabel(type)}</span>`;
    }
    return `<span style="${base}color:#8b949e;">${this._typeLabel(type)}</span>`;
  },

  _typeTip(type) {
    const flags = {
      arg_stock: '<span style="display:inline-block;width:14px;height:9px;border-radius:2px;vertical-align:middle;margin-right:4px;background:linear-gradient(180deg,#74ACDF 33%,#fff 33%,#fff 66%,#74ACDF 66%);"></span>',
      us_stock:  '<span style="display:inline-block;width:14px;height:9px;border-radius:2px;vertical-align:middle;margin-right:4px;background:linear-gradient(90deg,#002868 33%,#fff 33%,#fff 66%,#bf0a30 66%);"></span>',
      cedear:    '<span style="display:inline-block;width:14px;height:9px;border-radius:2px;vertical-align:middle;margin-right:4px;background:linear-gradient(135deg,#74ACDF,#8b5cf6);"></span>'
    };
    return (flags[type] || '') + I18n.t('type.' + type + '_tip');
  },

  _isEtf(fund) {
    return !!(fund && !fund.sector && fund.pe == null && fund.current_price != null);
  },

  _etfBadge() {
    const base = 'font-size:10px;margin-left:4px;padding:1px 5px;border-radius:3px;';
    return `<span style="${base}background:rgba(234,179,8,0.15);color:#eab308;font-weight:600;border:1px solid rgba(234,179,8,0.4);">ETF</span>`;
  },

  _brokerLabel(broker) {
    const labels = { balanz: 'BLZ', ib: 'IB' };
    return labels[broker] || '--';
  },

  _brokerTip(broker) {
    const tips = { balanz: 'broker.balanz_tip', ib: 'broker.ib_tip' };
    return tips[broker] ? I18n.t(tips[broker]) : I18n.t('broker.unknown');
  }
};
