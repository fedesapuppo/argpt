const Technicals = {
  render(technicalsData, pricesData, holdings, mep, fundamentals) {
    const tbody = document.getElementById('technicals-body');
    if (!technicalsData) { tbody.innerHTML = ''; return; }

    const typeMap = {};
    (holdings || []).forEach(h => { typeMap[h.ticker] = h.type; });
    const mepRate = mep?.mark;
    const fund = fundamentals || {};

    const rows = Object.entries(technicalsData).map(([ticker, t]) => {
      const price = this._findPrice(ticker, pricesData);
      const type = typeMap[ticker];
      const isArs = type === 'cedear' || type === 'arg_stock';
      const priceUsd = isArs && mepRate ? price / mepRate : price;
      // SMAs & % vs SMA:
      // arg_stocks: SMA in ARS → convert to USD, compare to priceUsd
      // us_stocks: SMA in USD, compare to priceUsd
      // CEDEARs: SMA in USD (US stock scale), use current_price from fundamentals for %
      const smaRef = type === 'cedear' ? fund[ticker]?.current_price : priceUsd;
      const sma20Usd = type === 'arg_stock' && mepRate && t.sma20 ? t.sma20 / mepRate : t.sma20;
      const sma50Usd = type === 'arg_stock' && mepRate && t.sma50 ? t.sma50 / mepRate : t.sma50;
      const sma20Pct = smaRef && sma20Usd ? ((smaRef - sma20Usd) / sma20Usd) * 100 : null;
      const sma50Pct = smaRef && sma50Usd ? ((smaRef - sma50Usd) / sma50Usd) * 100 : null;
      const row = { ticker, price: priceUsd, type, ...t, sma20: sma20Usd, sma50: sma50Usd, sma20_pct: sma20Pct, sma50_pct: sma50Pct };
      row.health = this._healthScore(row);
      return row;
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
        <td class="py-2 px-2 text-right relative" style="${this._athColor(r.pct_below_ath)}">${Currency.formatNum(r.pct_below_ath, 1)}%<span class="tip">${r.pct_below_ath != null && r.pct_below_ath < 1 ? 'At or near all-time high' : r.pct_below_ath != null && r.pct_below_ath > 50 ? 'More than 50% below ATH' : '% below all-time high'}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._rsiColor(r.rsi14)}">${Currency.formatNum(r.rsi14, 1)}<span class="tip">${this._rsiTip(r.rsi14)}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._stochColor(r.stochastic_k)}">${Currency.formatNum(r.stochastic_k, 1)}/${Currency.formatNum(r.stochastic_d, 1)}<span class="tip">${this._stochTip(r.stochastic_k, r.stochastic_d)}</span></td>
        <td class="py-2 px-2 text-center relative ${r.supertrend_trend === 'up' ? 'text-gain' : 'text-loss'}">${r.supertrend_trend === 'up' ? '▲ Up' : '▼ Down'}<span class="tip">${r.supertrend_trend === 'up' ? 'Bullish trend — price above Supertrend line' : 'Bearish trend — price below Supertrend line'}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._smaPctColor(r.sma20_pct)}">${r.sma20_pct != null ? Currency.formatPct(r.sma20_pct) : '--'}<span class="tip">${r.sma20 != null ? 'Price vs SMA20 (' + Currency.formatUSD(r.sma20) + ')' : '20-day average'}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._smaPctColor(r.sma50_pct)}">${r.sma50_pct != null ? Currency.formatPct(r.sma50_pct) : '--'}<span class="tip">${r.sma50 != null ? 'Price vs SMA50 (' + Currency.formatUSD(r.sma50) + ')' : '50-day average'}</span></td>
        <td class="py-2 px-2 text-center">${this._healthBadge(r)}</td>
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

  // Gradient helper: interpolates between a color and muted gray (#8b949e ≈ hsl(212,7%,58%))
  // t=0 → full color, t=1 → muted gray
  _fade(hue, t) {
    const s = Math.round(65 - t * 58); // 65% → 7%
    const l = Math.round(55 + t * 3);  // 55% → 58%
    const h = Math.round(hue + t * (212 - hue)); // target hue → 212 (gray)
    return `color: hsl(${h}, ${s}%, ${l}%)`;
  },

  // % Below ATH: 0% = green, 15% = muted, 30%+ = red
  // 0% = green (#3fb950), 15% = white, 30%+ = red (#f85149)
  _athColor(pct) {
    if (pct == null) return '';
    const clamped = Math.max(0, Math.min(pct, 30));
    if (clamped <= 15) {
      const t = clamped / 15; // 0→1: green → white
      const r = Math.round(63 + t * (255 - 63));
      const g = Math.round(185 + t * (255 - 185));
      const b = Math.round(80 + t * (255 - 80));
      return `color: rgb(${r},${g},${b})`;
    }
    const t = (clamped - 15) / 15; // 0→1: white → red
    const r = Math.round(255 - t * (255 - 248));
    const g = Math.round(255 - t * (255 - 81));
    const b = Math.round(255 - t * (255 - 73));
    return `color: rgb(${r},${g},${b})`;
  },

  // RSI: 0-20 = full red, 20-30 = red→white, 30-70 = white, 70-80 = white→green, 80+ = full green
  _rsiColor(rsi) {
    if (rsi == null) return '';
    if (rsi <= 20) return 'color: rgb(248,81,73)';
    if (rsi <= 30) {
      const t = (rsi - 20) / 10; // 0→1: red → white
      const r = Math.round(248 + t * (255 - 248));
      const g = Math.round(81 + t * (255 - 81));
      const b = Math.round(73 + t * (255 - 73));
      return `color: rgb(${r},${g},${b})`;
    }
    if (rsi <= 70) return '';
    if (rsi <= 80) {
      const t = (rsi - 70) / 10; // 0→1: white → green
      const r = Math.round(255 - t * (255 - 63));
      const g = Math.round(255 - t * (255 - 185));
      const b = Math.round(255 - t * (255 - 80));
      return `color: rgb(${r},${g},${b})`;
    }
    return 'color: rgb(63,185,80)';
  },

  _rsiTip(rsi) {
    if (rsi == null) return 'No RSI data';
    if (rsi < 30) return 'Oversold — stock under pressure';
    if (rsi > 70) return 'Strong momentum';
    return 'Neutral momentum';
  },

  // Stochastic: 0 = red, 20 = white, 20-80 = white, 80 = white, 100 = green
  _stochColor(k) {
    if (k == null) return '';
    if (k <= 20) {
      const t = k / 20; // 0→1: red → white
      const r = Math.round(248 + t * (255 - 248));
      const g = Math.round(81 + t * (255 - 81));
      const b = Math.round(73 + t * (255 - 73));
      return `color: rgb(${r},${g},${b})`;
    }
    if (k <= 80) return ''; // white zone
    const t = (k - 80) / 20; // 0→1: white → green
    const r = Math.round(255 - t * (255 - 63));
    const g = Math.round(255 - t * (255 - 185));
    const b = Math.round(255 - t * (255 - 80));
    return `color: rgb(${r},${g},${b})`;
  },

  _stochTip(k, d) {
    if (k == null) return 'No stochastic data';
    const zone = k < 20 ? 'Oversold zone' : k > 80 ? 'Overbought zone' : 'Neutral zone';
    if (d == null) return zone;
    const cross = k > d
      ? 'K above D — bullish signal' + (k < 20 ? ' (from oversold)' : '')
      : 'K below D — bearish signal' + (k > 80 ? ' (from overbought)' : '');
    return `${zone}. ${cross}`;
  },

  // SMA %: green when above, red when below, white near 0. Thresholds ±10%
  _smaPctColor(pct) {
    if (pct == null) return '';
    if (Math.abs(pct) < 1) return ''; // near SMA, default color
    if (pct > 0) {
      const t = Math.min(pct, 10) / 10; // 0→1: white → green
      const r = Math.round(255 - t * (255 - 63));
      const g = Math.round(255 - t * (255 - 185));
      const b = Math.round(255 - t * (255 - 80));
      return `color: rgb(${r},${g},${b})`;
    }
    const t = Math.min(Math.abs(pct), 10) / 10; // 0→1: white → red
    const r = Math.round(255 - t * (255 - 248));
    const g = Math.round(255 - t * (255 - 81));
    const b = Math.round(255 - t * (255 - 73));
    return `color: rgb(${r},${g},${b})`;
  },

  _healthScore(r) {
    let score = 0;
    let factors = 0;
    if (r.rsi14 != null) { score += r.rsi14 >= 50 ? 1 : -1; factors++; }
    if (r.stochastic_k != null && r.stochastic_d != null) { score += r.stochastic_k > r.stochastic_d ? 1 : -1; factors++; }
    if (r.supertrend_trend != null) { score += r.supertrend_trend === 'up' ? 1 : -1; factors++; }
    if (r.sma20_pct != null) { score += r.sma20_pct > 0 ? 1 : -1; factors++; }
    if (r.sma50_pct != null) { score += r.sma50_pct > 0 ? 1 : -1; factors++; }
    return factors ? score : null;
  },

  _healthBadge(r) {
    const score = r.health;
    if (score == null) return '<span class="text-muted">--</span>';

    const parts = [];
    if (r.rsi14 != null) parts.push('RSI ' + (r.rsi14 >= 50 ? '+' : '−'));
    if (r.stochastic_k != null && r.stochastic_d != null) parts.push('K/D ' + (r.stochastic_k > r.stochastic_d ? '+' : '−'));
    if (r.supertrend_trend != null) parts.push('Trend ' + (r.supertrend_trend === 'up' ? '+' : '−'));
    if (r.sma20_pct != null) parts.push('SMA20 ' + (r.sma20_pct > 0 ? '+' : '−'));
    if (r.sma50_pct != null) parts.push('SMA50 ' + (r.sma50_pct > 0 ? '+' : '−'));
    const tip = `Health: ${score} (${parts.join(', ')})`;

    const label = (score >= 0 ? '+' : '−') + Math.abs(score);
    const badge = (bg, color) => `<span class="inline-block w-8 text-center py-0.5 rounded text-xs font-mono tabular-nums ${bg} ${color} relative">${label}<span class="tip">${tip}</span></span>`;
    if (score >= 4) return badge('bg-gain/20', 'text-gain');
    if (score >= 2) return badge('bg-gain/10', 'text-gain/70');
    if (score >= -1) return badge('bg-surface-tertiary', 'text-muted');
    if (score >= -3) return badge('bg-loss/10', 'text-loss/70');
    return badge('bg-loss/20', 'text-loss');
  }
};
