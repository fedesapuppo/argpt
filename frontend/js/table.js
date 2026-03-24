const Table = {
  sortState: {},

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  renderPortfolio(result) {
    const tbody = document.getElementById('portfolio-body');
    const empty = document.getElementById('empty-state');

    if (!result.holdings.length) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    const isArs = (t) => t === 'cedear' || t === 'arg_stock';
    tbody.innerHTML = result.holdings.map(h => `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50">
        <td class="py-2 px-2 text-left relative">
          <span class="text-white font-medium">${this._esc(h.ticker)}</span>
          <span class="text-[10px] text-muted ml-1">${this._typeLabel(h.type)}</span>
          <span class="tip">${this._esc(h.ticker)} · ${this._typeLabel(h.type)}</span>
        </td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(h.shares, h.shares % 1 ? 2 : 0)}<span class="tip">Qty held</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(h.avg_price, 2)}<span class="tip">Avg buy price · ${isArs(h.type) ? 'ARS' : 'USD'} per share</span></td>
        <td class="py-2 px-2 text-right relative">${h.cost_basis_usd != null ? Currency.formatUSD(h.cost_basis_usd) : '--'}<span class="tip">${isArs(h.type) ? 'Avg ARS price ÷ entry MEP rate' : 'Avg price in USD'}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatUSD(h.current_price_usd)}<span class="tip">Current price in USD</span></td>

        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.capital_return_pct)}">${Currency.formatPct(h.capital_return_pct)}<span class="tip">Asset price change · ${isArs(h.type) ? 'ARS' : 'USD'}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.currency_return_pct)}">${Currency.formatPct(h.currency_return_pct)}<span class="tip">${isArs(h.type) ? 'MEP rate change since purchase' : 'No FX exposure'}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.total_return_usd_pct)}">${Currency.formatPct(h.total_return_usd_pct)}<span class="tip">Combined asset + currency return in USD</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(h.pnl_usd)}">${h.pnl_usd != null ? Currency.formatUSD(h.pnl_usd) : '--'}<span class="tip">USD P&amp;L = (price − cost) × shares</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(h.weight_pct, 1)}%<span class="tip">% of total portfolio</span></td>
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

  setupSorting(tableId, data, renderFn) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        const state = this.sortState[tableId] || {};
        const dir = state.key === key && state.dir === 'asc' ? 'desc' : 'asc';
        this.sortState[tableId] = { key, dir };

        table.querySelectorAll('th').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');

        data.sort((a, b) => {
          const av = a[key] ?? -Infinity;
          const bv = b[key] ?? -Infinity;
          if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
          return dir === 'asc' ? av - bv : bv - av;
        });

        renderFn(data);
      });
    });
  },

  _typeLabel(type) {
    const labels = { cedear: 'CED', arg_stock: 'ARG', us_stock: 'US' };
    return labels[type] || type;
  }
};
