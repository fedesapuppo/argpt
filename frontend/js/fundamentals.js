const Fundamentals = {
  render(fundamentalsData) {
    const tbody = document.getElementById('fundamentals-body');
    if (!fundamentalsData) { tbody.innerHTML = ''; return; }

    const rows = Object.entries(fundamentalsData).map(([ticker, f]) => ({
      ticker, ...f
    }));

    tbody.innerHTML = rows.map(r => this._renderRow(r)).join('');

    Table.setupSorting('fundamentals-table', rows, (sorted) => {
      document.getElementById('fundamentals-body').innerHTML = sorted.map(r => this._renderRow(r)).join('');
    });
  },

  _renderRow(r) {
    const th = r.thresholds || {};
    return `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50">
        <td class="py-2 px-2 text-left font-medium text-white">${Table._esc(r.ticker)}</td>
        <td class="py-2 px-2 text-right ${Currency.thresholdClass(th.pe)}">${Currency.formatNum(r.pe, 1)}</td>
        <td class="py-2 px-2 text-right">${Currency.formatNum(r.forward_pe, 1)}</td>
        <td class="py-2 px-2 text-right">${Currency.formatNum(r.pb, 1)}</td>
        <td class="py-2 px-2 text-right ${Currency.thresholdClass(th.roe)}">${Currency.formatNum(r.roe, 1)}</td>
        <td class="py-2 px-2 text-right ${Currency.pctClass(r.eps_growth)}">${Currency.formatNum(r.eps_growth, 1)}</td>
        <td class="py-2 px-2 text-right">${Currency.formatNum(r.dividend_yield, 2)}</td>
        <td class="py-2 px-2 text-right ${Currency.thresholdClass(th.debt_to_equity)}">${Currency.formatNum(r.debt_to_equity, 1)}</td>
        <td class="py-2 px-2 text-right ${Currency.thresholdClass(th.profit_margin)}">${Currency.formatNum(r.profit_margin, 1)}</td>
        <td class="py-2 px-2 text-left text-xs text-muted">${Table._esc(r.sector || '--')}</td>
      </tr>
    `;
  }
};
