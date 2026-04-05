import Currency from './currency.js';
import Filter from './filter.js';
import I18n from './i18n.js';
import Table from './table.js';

const Technicals = {
  render(technicalsData, pricesData, holdings, mep, fundamentals) {
    const tbody = document.getElementById('technicals-body');
    if (!technicalsData) { tbody.innerHTML = ''; return; }

    const typeMap = {};
    (holdings || []).forEach(h => { typeMap[h.ticker] = h.type; });
    const mepRate = mep?.mark;
    const fund = fundamentals || {};
    const held = new Set((holdings || []).map(h => h.ticker));

    if (!held.size) { tbody.innerHTML = ''; return; }

    const rows = Object.entries(technicalsData).filter(([ticker]) => held.has(ticker)).map(([ticker, t]) => {
      const price = this._findPrice(ticker, pricesData);
      const type = typeMap[ticker];
      const isArs = type === 'cedear' || type === 'arg_stock';
      const priceUsd = isArs && mepRate ? price / mepRate : price;
      const smaRef = type === 'cedear' ? fund[ticker]?.current_price : priceUsd;
      const sma20Usd = type === 'arg_stock' && mepRate && t.sma20 ? t.sma20 / mepRate : t.sma20;
      const sma50Usd = type === 'arg_stock' && mepRate && t.sma50 ? t.sma50 / mepRate : t.sma50;
      const sma20Pct = smaRef && sma20Usd ? ((smaRef - sma20Usd) / sma20Usd) * 100 : null;
      const sma50Pct = smaRef && sma50Usd ? ((smaRef - sma50Usd) / sma50Usd) * 100 : null;
      const row = { ticker, price: priceUsd, type, ...t, sma20: sma20Usd, sma50: sma50Usd, sma20_pct: sma20Pct, sma50_pct: sma50Pct };
      row.is_etf = Table._isEtf(fund[ticker]);
      row.health = this._healthScore(row);
      return row;
    });

    tbody.innerHTML = this._rowsHtml(rows);
    Table.setupSorting('technicals-table', rows, (sorted) => {
      tbody.innerHTML = this._rowsHtml(sorted);
    });
  },

  _rowsHtml(rows) {
    return rows.filter(r => Filter.matches(r.type)).map(r => `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50">
        <td class="py-2 px-2 text-left relative">
          <span class="text-white font-medium inline-block" style="min-width:3.25rem">${Table._esc(r.ticker)}</span>
          ${r.type ? Table._typeBadge(r.type) : ''}
          ${r.is_etf ? Table._etfBadge() : ''}
          <span class="tip">${Table._esc(r.ticker)}${r.type ? ' · ' + Table._typeTip(r.type) : ''}${r.is_etf ? ' · ' + I18n.t('tip.etf') : ''}</span>
        </td>
        <td class="py-2 px-2 text-right relative">${Currency.formatUSD(r.price)}<span class="tip">${I18n.t('tip.current_price_usd')}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._athColor(r.pct_below_ath)}">${this._athArrow(r.pct_below_ath)}${Currency.formatNum(r.pct_below_ath, 1)}%<span class="tip">${r.pct_below_ath != null && r.pct_below_ath < 1 ? I18n.t('tip.at_ath') : r.pct_below_ath != null && r.pct_below_ath > 50 ? I18n.t('tip.far_ath') : I18n.t('tip.below_ath')}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._rsiColor(r.rsi14)}">${this._rsiArrow(r.rsi14)}${Currency.formatNum(r.rsi14, 1)}<span class="tip">${this._rsiTip(r.rsi14)}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._stochColor(r.stochastic_k)}">${this._stochArrow(r.stochastic_k)}${Currency.formatNum(r.stochastic_k, 1)}/${Currency.formatNum(r.stochastic_d, 1)}<span class="tip">${this._stochTip(r.stochastic_k, r.stochastic_d)}</span></td>
        <td class="py-2 px-2 text-center relative ${r.supertrend_trend === 'up' ? 'text-gain' : 'text-loss'}">${r.supertrend_trend === 'up' ? I18n.t('tip.supertrend_up_short') : I18n.t('tip.supertrend_down_short')}<span class="tip">${r.supertrend_trend === 'up' ? I18n.t('tip.supertrend_up') : I18n.t('tip.supertrend_down')}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._smaPctColor(r.sma20_pct)}">${r.sma20_pct != null ? Currency.formatPct(r.sma20_pct) : '--'}<span class="tip">${r.sma20 != null ? I18n.t('tip.price_vs_sma', { period: '20', value: Currency.formatUSD(r.sma20) }) : I18n.t('tip.sma_label', { period: '20' })}</span></td>
        <td class="py-2 px-2 text-right relative" style="${this._smaPctColor(r.sma50_pct)}">${r.sma50_pct != null ? Currency.formatPct(r.sma50_pct) : '--'}<span class="tip">${r.sma50 != null ? I18n.t('tip.price_vs_sma', { period: '50', value: Currency.formatUSD(r.sma50) }) : I18n.t('tip.sma_label', { period: '50' })}</span></td>
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

  _fade(hue, t) {
    const s = Math.round(65 - t * 58);
    const l = Math.round(55 + t * 3);
    const h = Math.round(hue + t * (212 - hue));
    return `color: hsl(${h}, ${s}%, ${l}%)`;
  },

  _athColor(pct) {
    if (pct == null) return '';
    const clamped = Math.max(0, Math.min(pct, 30));
    if (clamped <= 15) {
      const t = clamped / 15;
      const r = Math.round(63 + t * (255 - 63));
      const g = Math.round(185 + t * (255 - 185));
      const b = Math.round(80 + t * (255 - 80));
      return `color: rgb(${r},${g},${b})`;
    }
    const t = (clamped - 15) / 15;
    const r = Math.round(255 - t * (255 - 248));
    const g = Math.round(255 - t * (255 - 81));
    const b = Math.round(255 - t * (255 - 73));
    return `color: rgb(${r},${g},${b})`;
  },

  _rsiColor(rsi) {
    if (rsi == null) return '';
    if (rsi <= 20) return 'color: rgb(248,81,73)';
    if (rsi <= 30) {
      const t = (rsi - 20) / 10;
      const r = Math.round(248 + t * (255 - 248));
      const g = Math.round(81 + t * (255 - 81));
      const b = Math.round(73 + t * (255 - 73));
      return `color: rgb(${r},${g},${b})`;
    }
    if (rsi <= 70) return '';
    if (rsi <= 80) {
      const t = (rsi - 70) / 10;
      const r = Math.round(255 - t * (255 - 63));
      const g = Math.round(255 - t * (255 - 185));
      const b = Math.round(255 - t * (255 - 80));
      return `color: rgb(${r},${g},${b})`;
    }
    return 'color: rgb(63,185,80)';
  },

  _rsiTip(rsi) {
    if (rsi == null) return I18n.t('tip.no_rsi');
    if (rsi < 30) return I18n.t('tip.oversold');
    if (rsi > 70) return I18n.t('tip.strong_momentum');
    return I18n.t('tip.neutral_momentum');
  },

  _stochColor(k) {
    if (k == null) return '';
    if (k <= 20) {
      const t = k / 20;
      const r = Math.round(248 + t * (255 - 248));
      const g = Math.round(81 + t * (255 - 81));
      const b = Math.round(73 + t * (255 - 73));
      return `color: rgb(${r},${g},${b})`;
    }
    if (k <= 80) return '';
    const t = (k - 80) / 20;
    const r = Math.round(255 - t * (255 - 63));
    const g = Math.round(255 - t * (255 - 185));
    const b = Math.round(255 - t * (255 - 80));
    return `color: rgb(${r},${g},${b})`;
  },

  _stochTip(k, d) {
    if (k == null) return I18n.t('tip.no_stoch');
    const zone = k < 20 ? I18n.t('tip.oversold_zone') : k > 80 ? I18n.t('tip.overbought_zone') : I18n.t('tip.neutral_zone');
    if (d == null) return zone;
    const cross = k > d
      ? I18n.t('tip.k_above_d') + (k < 20 ? I18n.t('tip.from_oversold') : '')
      : I18n.t('tip.k_below_d') + (k > 80 ? I18n.t('tip.from_overbought') : '');
    return `${zone}. ${cross}`;
  },

  _smaPctColor(pct) {
    if (pct == null) return '';
    if (Math.abs(pct) < 1) return '';
    if (pct > 0) {
      const t = Math.min(pct, 10) / 10;
      const r = Math.round(255 - t * (255 - 63));
      const g = Math.round(255 - t * (255 - 185));
      const b = Math.round(255 - t * (255 - 80));
      return `color: rgb(${r},${g},${b})`;
    }
    const t = Math.min(Math.abs(pct), 10) / 10;
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
    const tip = I18n.t('tip.health_label', { score: score, parts: parts.join(', ') });

    const label = (score >= 0 ? '+' : '−') + Math.abs(score);
    const badge = (bg, color) => `<span class="inline-block w-8 text-center py-0.5 rounded text-xs font-mono tabular-nums ${bg} ${color} relative">${label}<span class="tip">${tip}</span></span>`;
    if (score >= 4) return badge('bg-gain/20', 'text-gain');
    if (score >= 2) return badge('bg-gain/10', 'text-gain/70');
    if (score >= -1) return badge('bg-surface-tertiary', 'text-muted');
    if (score >= -3) return badge('bg-loss/10', 'text-loss/70');
    return badge('bg-loss/20', 'text-loss');
  },

  _athArrow(pct) {
    if (pct == null) return '';
    if (pct < 5) return '▲ ';
    if (pct > 20) return '▼ ';
    return '';
  },

  _rsiArrow(rsi) {
    if (rsi == null) return '';
    if (rsi < 30) return '▼ ';
    if (rsi > 70) return '▲ ';
    return '';
  },

  _stochArrow(k) {
    if (k == null) return '';
    if (k < 20) return '▼ ';
    if (k > 80) return '▲ ';
    return '';
  }
};

export default Technicals;
