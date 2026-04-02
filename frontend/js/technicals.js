const Technicals = {
  render(technicalsData, pricesData, holdings, mep) {
    const tbody = document.getElementById('technicals-body');
    if (!technicalsData) { tbody.innerHTML = ''; return; }

    const typeMap = {};
    (holdings || []).forEach(h => { typeMap[h.ticker] = h.type; });
    const mepRate = mep?.mark;

    const rows = Object.entries(technicalsData).map(([ticker, t]) => {
      const price = this._findPrice(ticker, pricesData);
      const type = typeMap[ticker];
      const isArs = type === 'cedear' || type === 'arg_stock';
      const priceUsd = isArs && mepRate ? price / mepRate : price;
      const sma20Usd = isArs && mepRate && t.sma20 ? t.sma20 / mepRate : t.sma20;
      const sma50Usd = isArs && mepRate && t.sma50 ? t.sma50 / mepRate : t.sma50;
      return { ticker, price: priceUsd, type, ...t, sma20: sma20Usd, sma50: sma50Usd };
    });

    tbody.innerHTML = this._rowsHtml(rows);
    Table.setupSorting('technicals-table', rows, (sorted) => {
      tbody.innerHTML = this._rowsHtml(sorted);
    });
  },

  _rowsHtml(rows) {
    return rows.map(r => `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50">
        <td class="py-2 px-2 text-left relative">
          <span class="text-white font-medium">${Table._esc(r.ticker)}</span>
          ${r.type ? '<span class="text-[10px] text-muted ml-1">' + Table._typeLabel(r.type) + '</span>' : ''}
          <span class="tip">${Table._esc(r.ticker)}${r.type ? ' · ' + Table._typeTip(r.type) : ''}</span>
        </td>
        <td class="py-2 px-2 text-right relative">${Currency.formatUSD(r.price)}<span class="tip">Current price in USD</span></td>
        <td class="py-2 px-2 text-right relative ${r.pct_below_ath != null && r.pct_below_ath > 20 ? 'text-loss' : ''}">${Currency.formatNum(r.pct_below_ath, 1)}%<span class="tip">${r.pct_below_ath != null && r.pct_below_ath < 1 ? 'At or near all-time high' : r.pct_below_ath != null && r.pct_below_ath > 50 ? 'More than 50% below ATH' : '% below all-time high'}</span></td>
        <td class="py-2 px-2 text-right relative ${this._rsiClass(r.rsi14)}">${Currency.formatNum(r.rsi14, 1)}<span class="tip">${this._rsiTip(r.rsi14)}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(r.stochastic_k, 1)}/${Currency.formatNum(r.stochastic_d, 1)}<span class="tip">${r.stochastic_k != null && r.stochastic_k < 20 ? 'Oversold zone' : r.stochastic_k != null && r.stochastic_k > 80 ? 'Overbought zone' : 'Neutral zone'}</span></td>
        <td class="py-2 px-2 text-center relative ${r.supertrend_trend === 'up' ? 'text-gain' : 'text-loss'}">${r.supertrend_trend === 'up' ? '▲ Up' : '▼ Down'}<span class="tip">${r.supertrend_trend === 'up' ? 'Bullish trend — price above Supertrend line' : 'Bearish trend — price below Supertrend line'}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatUSD(r.sma20)}<span class="tip">${r.price != null && r.sma20 != null ? (r.price > r.sma20 ? 'Price above SMA20' : 'Price below SMA20') : '20-day average'}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatUSD(r.sma50)}<span class="tip">${r.price != null && r.sma50 != null ? (r.price > r.sma50 ? 'Price above SMA50' : 'Price below SMA50') : '50-day average'}</span></td>
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

  _rsiTip(rsi) {
    if (rsi == null) return 'No RSI data';
    if (rsi < 30) return 'Oversold — potential buying opportunity';
    if (rsi > 70) return 'Overbought — potential selling pressure';
    return 'Neutral momentum';
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
