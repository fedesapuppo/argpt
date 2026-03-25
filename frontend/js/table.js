const Table = {
  sortState: {},

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  renderPortfolio(result) {
    const empty = document.getElementById('empty-state');

    if (!result.holdings.length) {
      document.getElementById('portfolio-body').innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    this._portfolioData = result.holdings;
    this._renderPortfolioRows(result.holdings);
    this.setupSorting('portfolio-table', this._portfolioData, (sorted) => {
      this._renderPortfolioRows(sorted);
    });
  },

  _renderPortfolioRows(holdings) {
    const tbody = document.getElementById('portfolio-body');
    const isArs = (t) => t === 'cedear' || t === 'arg_stock';
    tbody.innerHTML = holdings.map(h => `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50">
        <td class="py-2 px-2 text-left relative">
          <span class="text-white font-medium">${this._esc(h.ticker)}</span>
          <span class="text-[10px] text-muted ml-1">${this._typeLabel(h.type)}</span>
          <span class="tip">${this._esc(h.ticker)} · ${this._typeTip(h.type)}</span>
        </td>
        <td class="py-2 px-2 text-center text-xs text-muted relative">${this._brokerLabel(h.broker)}<span class="tip">${this._brokerTip(h.broker)}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(h.shares, h.shares % 1 ? 2 : 0)}<span class="tip">Shares held</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(h.avg_price, 2)}<span class="tip">Avg buy price in ${isArs(h.type) ? 'ARS' : 'USD'} per share</span></td>
        <td class="py-2 px-2 text-right relative">${h.cost_basis_usd != null ? Currency.formatUSD(h.cost_basis_usd) : '--'}<span class="tip">${isArs(h.type) ? 'ARS price ÷ MEP at purchase date' : 'Purchase price in USD'}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatUSD(h.current_price_usd)}<span class="tip">${isArs(h.type) ? 'ARS price ÷ current MEP rate' : 'Current USD price'}</span></td>

        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.capital_return_pct)}">${Currency.formatPct(h.capital_return_pct)}<span class="tip">${isArs(h.type) ? 'ARS price change since purchase' : 'USD price change since purchase'}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.currency_return_pct)}">${Currency.formatPct(h.currency_return_pct)}<span class="tip">${isArs(h.type) ? 'Peso movement: MEP went from ' + Currency.formatNum(h.entry_fx_rate, 0) + ' to current rate' : 'No FX conversion — already in USD'}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.total_return_usd_pct)}">${Currency.formatPct(h.total_return_usd_pct)}<span class="tip">(1 + capital) × (1 + currency) − 1</span></td>
        <td class="py-2 px-2 text-right relative">${h.value_usd ? Currency.formatUSD(h.value_usd) : '--'}<span class="tip">Shares × current USD price</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.pnl_usd)}">${h.pnl_usd != null ? Currency.formatUSD(h.pnl_usd) : '--'}<span class="tip">(USD price − USD cost) × shares</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(h.weight_pct, 1)}%<span class="tip">% of total portfolio value in USD</span></td>
        <td class="py-2 px-2 text-center">
          <button class="remove-btn text-muted hover:text-loss text-xs" data-index="${h.index}">✕</button>
        </td>
      </tr>
    `).join('');

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-btn');
      if (btn) Form.removeHolding(parseInt(btn.dataset.index));
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

    table.querySelector('thead').addEventListener('click', (e) => {
      const th = e.target.closest('th[data-sort]');
      if (!th) return;

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
    });
  },

  _typeLabel(type) {
    const labels = { cedear: 'CED', arg_stock: 'ARG', us_stock: 'US' };
    return labels[type] || type;
  },

  _typeTip(type) {
    const tips = {
      cedear: 'CEDEAR — Argentine depositary receipt (priced in ARS, converted via MEP)',
      arg_stock: 'Argentine equity listed on BYMA (priced in ARS, converted via MEP)',
      us_stock: 'US equity (priced in USD)'
    };
    return tips[type] || type;
  },

  _brokerLabel(broker) {
    const labels = { balanz: 'BLZ', ib: 'IB' };
    return labels[broker] || '--';
  },

  _brokerTip(broker) {
    const tips = {
      balanz: 'Balanz — Argentine broker',
      ib: 'Interactive Brokers — US broker'
    };
    return tips[broker] || 'Unknown broker';
  }
};
