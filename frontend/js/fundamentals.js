const Fundamentals = {
  render(fundamentalsData, holdings) {
    const tbody = document.getElementById('fundamentals-body');
    if (!fundamentalsData) { tbody.innerHTML = ''; return; }

    const typeMap = {};
    (holdings || []).forEach(h => { typeMap[h.ticker] = h.type; });

    const rows = Object.entries(fundamentalsData).map(([ticker, f]) => ({
      ticker, type: typeMap[ticker], ...f
    }));

    tbody.innerHTML = rows.map(r => this._renderRow(r)).join('');

    Table.setupSorting('fundamentals-table', rows, (sorted) => {
      document.getElementById('fundamentals-body').innerHTML = sorted.map(r => this._renderRow(r)).join('');
    });
  },

  _thresholdTip(status, metric, sector) {
    if (!status) return `${metric} — no sector benchmark`;
    const labels = { green: 'Favorable', yellow: 'In line', red: 'Unfavorable' };
    return `${labels[status] || status} vs ${sector} median`;
  },

  _renderRow(r) {
    const th = r.thresholds || {};
    const sec = r.sector || 'its sector';
    return `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50">
        <td class="py-2 px-2 text-left relative">
          <span class="text-white font-medium">${Table._esc(r.ticker)}</span>
          ${r.type ? '<span class="text-[10px] text-muted ml-1">' + Table._typeLabel(r.type) + '</span>' : ''}
          <span class="tip">${Table._esc(r.ticker)}${r.type ? ' · ' + Table._typeTip(r.type) : ''}</span>
        </td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.pe)}">${Currency.formatNum(r.pe, 1)}<span class="tip">${this._thresholdTip(th.pe, 'P/E', sec)}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(r.forward_pe, 1)}<span class="tip">Expected P/E based on analyst estimates</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(r.pb, 1)}<span class="tip">Price relative to book value</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.roe)}">${Currency.formatNum(r.roe, 1)}<span class="tip">${this._thresholdTip(th.roe, 'ROE', sec)}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(r.eps_growth)}">${Currency.formatNum(r.eps_growth, 1)}<span class="tip">${r.eps_growth != null ? (r.eps_growth > 0 ? 'Earnings growing' : 'Earnings declining') : 'No data'}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(r.dividend_yield, 2)}<span class="tip">${r.dividend_yield != null && r.dividend_yield > 0 ? 'Annual dividend as % of price' : 'No dividend'}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.debt_to_equity)}">${Currency.formatNum(r.debt_to_equity, 1)}<span class="tip">${this._thresholdTip(th.debt_to_equity, 'D/E', sec)}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.profit_margin)}">${Currency.formatNum(r.profit_margin, 1)}<span class="tip">${this._thresholdTip(th.profit_margin, 'Margin', sec)}</span></td>
        <td class="py-2 px-2 text-left text-xs text-muted relative">${Table._esc(r.sector || '--')}<span class="tip">Benchmark comparison group</span></td>
      </tr>
    `;
  }
};
