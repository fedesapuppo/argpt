const Technicals = {
  render(technicalsData, pricesData) {
    const tbody = document.getElementById('technicals-body');
    if (!technicalsData) { tbody.innerHTML = ''; return; }

    const rows = Object.entries(technicalsData).map(([ticker, t]) => {
      const price = this._findPrice(ticker, pricesData);
      return { ticker, price, ...t };
    });

    tbody.innerHTML = this._rowsHtml(rows);
    Table.setupSorting('technicals-table', rows, (sorted) => {
      tbody.innerHTML = this._rowsHtml(sorted);
    });
  },

  _rowsHtml(rows) {
    return rows.map(r => `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50">
        <td class="py-2 px-2 text-left font-medium text-white">${Table._esc(r.ticker)}</td>
        <td class="py-2 px-2 text-right">${Currency.formatNum(r.price, 2)}</td>
        <td class="py-2 px-2 text-right ${r.pct_below_ath != null && r.pct_below_ath > 20 ? 'text-loss' : ''}">${Currency.formatNum(r.pct_below_ath, 1)}%</td>
        <td class="py-2 px-2 text-right ${this._rsiClass(r.rsi14)}">${Currency.formatNum(r.rsi14, 1)}</td>
        <td class="py-2 px-2 text-right">${Currency.formatNum(r.stochastic_k, 1)}/${Currency.formatNum(r.stochastic_d, 1)}</td>
        <td class="py-2 px-2 text-center ${r.supertrend_trend === 'up' ? 'text-gain' : 'text-loss'}">${r.supertrend_trend === 'up' ? '▲ Up' : '▼ Down'}</td>
        <td class="py-2 px-2 text-right">${Currency.formatNum(r.sma20, 2)}</td>
        <td class="py-2 px-2 text-right">${Currency.formatNum(r.sma50, 2)}</td>
        <td class="py-2 px-2 text-center">${this._signalBadge(r)}</td>
      </tr>
    `).join('');
  },

  _findPrice(ticker, pricesData) {
    if (!pricesData) return null;
    for (const [key, data] of Object.entries(pricesData)) {
      if (key.startsWith(ticker + ':')) return data.last;
    }
    return null;
  },

  _rsiClass(rsi) {
    if (rsi == null) return '';
    if (rsi < 30) return 'text-gain';
    if (rsi > 70) return 'text-loss';
    return '';
  },

  _signalBadge(r) {
    const rsi = r.rsi14;
    const k = r.stochastic_k;
    if (rsi == null) return '<span class="text-muted">--</span>';

    let score = 0;
    if (rsi < 30) score--;
    if (rsi > 70) score++;
    if (k != null && k < 20) score--;
    if (k != null && k > 80) score++;

    if (score <= -1) return '<span class="px-2 py-0.5 rounded text-xs bg-gain/20 text-gain">Oversold</span>';
    if (score >= 1) return '<span class="px-2 py-0.5 rounded text-xs bg-loss/20 text-loss">Overbought</span>';
    return '<span class="px-2 py-0.5 rounded text-xs bg-surface-tertiary text-muted">Neutral</span>';
  }
};
