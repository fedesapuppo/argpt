const Fundamentals = {
  HEALTH_METRICS: ['pe', 'forward_pe', 'pb', 'roe', 'debt_to_equity', 'profit_margin'],
  HEALTH_LABELS: { pe: 'PE', forward_pe: 'FwdPE', pb: 'PB', roe: 'ROE', debt_to_equity: 'DE', profit_margin: 'Margin' },

  render(fundamentalsData, holdings) {
    const tbody = document.getElementById('fundamentals-body');
    if (!fundamentalsData) { tbody.innerHTML = ''; return; }

    const typeMap = {};
    (holdings || []).forEach(h => { typeMap[h.ticker] = h.type; });

    const rows = Object.entries(fundamentalsData).map(([ticker, f]) => {
      const row = { ticker, type: typeMap[ticker], ...f };
      row.health = this._healthScore(row);
      return row;
    });

    tbody.innerHTML = rows.filter(r => Filter.matches(r.type)).map(r => this._renderRow(r)).join('');

    Table.setupSorting('fundamentals-table', rows, (sorted) => {
      document.getElementById('fundamentals-body').innerHTML = sorted.filter(r => Filter.matches(r.type)).map(r => this._renderRow(r)).join('');
    });
  },

  _thresholdTip(status, metric, sector, median, isEtf) {
    if (!status) return isEtf ? `${metric} — N/A for ETFs` : I18n.t('tip.no_benchmark', { metric });
    const labels = { green: I18n.t('tip.favorable'), yellow: I18n.t('tip.in_line'), red: I18n.t('tip.unfavorable') };
    const label = labels[status] || status;
    if (median != null) return I18n.t('tip.vs_sector_value', { label, sector, value: Currency.formatNum(median, 1) });
    return I18n.t('tip.vs_sector', { label, sector });
  },

  _healthScore(r) {
    const th = r.thresholds || {};
    let score = 0, factors = 0;
    for (const m of this.HEALTH_METRICS) {
      if (th[m] === 'green') { score += 1; factors++; }
      else if (th[m] === 'red') { score -= 1; factors++; }
      else if (th[m] === 'yellow') { factors++; }
    }
    return factors ? score : null;
  },

  _healthBadge(r) {
    const score = r.health;
    if (score == null) return '<span class="text-muted">--</span>';

    const th = r.thresholds || {};
    const parts = [];
    for (const m of this.HEALTH_METRICS) {
      if (!th[m]) continue;
      const sign = th[m] === 'green' ? '+' : th[m] === 'red' ? '−' : '=';
      parts.push(this.HEALTH_LABELS[m] + ' ' + sign);
    }
    const tip = I18n.t('tip.health_label', { score: score, parts: parts.join(', ') });

    const label = (score >= 0 ? '+' : '−') + Math.abs(score);
    const badge = (bg, color) => `<span class="inline-block w-8 text-center py-0.5 rounded text-xs font-mono tabular-nums ${bg} ${color} relative">${label}<span class="tip">${tip}</span></span>`;
    if (score >= 4) return badge('bg-gain/20', 'text-gain');
    if (score >= 2) return badge('bg-gain/10', 'text-gain/70');
    if (score >= -1) return badge('bg-surface-tertiary', 'text-muted');
    if (score >= -3) return badge('bg-loss/10', 'text-loss/70');
    return badge('bg-loss/20', 'text-loss');
  },

  _renderRow(r) {
    const th = r.thresholds || {};
    const med = r.medians || {};
    const sec = r.sector || 'its sector';
    const etf = !r.sector && r.pe == null;
    return `
      <tr class="border-b border-surface-border/50 hover:bg-surface-secondary/50">
        <td class="py-2 px-2 text-left relative">
          <span class="text-white font-medium">${Table._esc(r.ticker)}</span>
          ${r.type ? Table._typeBadge(r.type) : ''}
          <span class="tip">${Table._esc(r.ticker)}${r.type ? ' · ' + Table._typeTip(r.type) : ''}</span>
        </td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.pe)}">${Currency.thresholdArrow(th.pe)}${Currency.formatNum(r.pe, 1)}<span class="tip">${this._thresholdTip(th.pe, 'P/E', sec, med.pe, etf)}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.forward_pe)}">${Currency.thresholdArrow(th.forward_pe)}${Currency.formatNum(r.forward_pe, 1)}<span class="tip">${this._thresholdTip(th.forward_pe, 'Fwd P/E', sec, med.pe, etf)}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.pb)}">${Currency.thresholdArrow(th.pb)}${Currency.formatNum(r.pb, 1)}<span class="tip">${this._thresholdTip(th.pb, 'P/B', sec, med.pb, etf)}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.roe)}">${Currency.thresholdArrow(th.roe)}${Currency.formatNum(r.roe, 1)}<span class="tip">${this._thresholdTip(th.roe, 'ROE', sec, med.roe, etf)}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.pctClass(r.eps_growth)}">${Currency.pctArrow(r.eps_growth)}${Currency.formatNum(r.eps_growth, 1)}<span class="tip">${r.eps_growth != null ? (r.eps_growth > 0 ? I18n.t('tip.earnings_growing') : I18n.t('tip.earnings_declining')) : I18n.t('tip.no_data')}</span></td>
        <td class="py-2 px-2 text-right relative">${Currency.formatNum(r.dividend_yield, 2)}<span class="tip">${r.dividend_yield != null && r.dividend_yield > 0 ? I18n.t('tip.dividend_pct') : I18n.t('tip.no_dividend')}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.debt_to_equity)}">${Currency.thresholdArrow(th.debt_to_equity)}${Currency.formatNum(r.debt_to_equity, 1)}<span class="tip">${this._thresholdTip(th.debt_to_equity, 'D/E', sec, med.debt_to_equity, etf)}</span></td>
        <td class="py-2 px-2 text-right relative ${Currency.thresholdClass(th.profit_margin)}">${Currency.thresholdArrow(th.profit_margin)}${Currency.formatNum(r.profit_margin, 1)}<span class="tip">${this._thresholdTip(th.profit_margin, 'Margin', sec, med.profit_margin, etf)}</span></td>
        <td class="py-2 pl-8 pr-4 text-left text-xs text-muted relative whitespace-nowrap">${Table._esc(r.sector || (r.pe == null ? 'ETF' : '--'))}<span class="tip">${I18n.t('tip.benchmark_group')}</span></td>
        <td class="py-2 px-2 text-center relative">${this._healthBadge(r)}</td>
      </tr>
    `;
  }
};
