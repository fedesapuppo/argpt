const Chart = {
  render(holdings) {
    const container = document.getElementById('chart-container');
    if (!container) return;

    if (!holdings || !holdings.length) {
      container.innerHTML = '';
      return;
    }

    const byType = {};
    for (const h of holdings) {
      byType[h.type] = (byType[h.type] || 0) + (h.value_usd || 0);
    }

    const total = Object.values(byType).reduce((s, v) => s + v, 0);
    if (total <= 0) { container.innerHTML = ''; return; }

    const types = Object.keys(byType).sort();
    const segments = types.map(type => ({
      type,
      value: byType[type],
      pct: (byType[type] / total) * 100,
      label: I18n.t('option.' + type) || type
    }));

    const barHeight = 28;
    let x = 0;

    const defs = `<defs>
      <linearGradient id="grad-arg_stock" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#74ACDF"/>
        <stop offset="35%" stop-color="#74ACDF"/>
        <stop offset="35%" stop-color="#fff"/>
        <stop offset="65%" stop-color="#fff"/>
        <stop offset="65%" stop-color="#74ACDF"/>
        <stop offset="100%" stop-color="#74ACDF"/>
      </linearGradient>
      <linearGradient id="grad-cedear" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#74ACDF"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
      <linearGradient id="grad-us_stock" x1="0" y1="0" x2="0" y2="0">
        <stop offset="0%" stop-color="#002868"/>
        <stop offset="100%" stop-color="#002868"/>
      </linearGradient>
    </defs>`;

    const LEGEND_COLORS = { arg_stock: '#74ACDF', cedear: '#8b5cf6', us_stock: '#002868' };

    const rects = segments.map(s => {
      const w = (s.pct / 100) * 100;
      const fill = `url(#grad-${s.type})`;
      const rect = `<rect x="${x}%" y="0" width="${w}%" height="${barHeight}" fill="${fill}" rx="0"/>`;
      const textX = x + w / 2;
      const textColor = s.type === 'us_stock' ? '#fff' : '#0d1117';
      const text = w > 8
        ? `<text x="${textX}%" y="${barHeight / 2 + 1}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-size="11" font-weight="600" font-family="IBM Plex Sans, sans-serif">${s.pct.toFixed(0)}%</text>`
        : '';
      x += w;
      return rect + text;
    });

    const legend = segments.map(s =>
      `<span class="flex items-center gap-1.5">
        <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:${LEGEND_COLORS[s.type] || '#8b949e'}"></span>
        <span class="text-xs">${s.label}</span>
        <span class="text-xs text-muted">${Currency.formatUSD(s.value)} (${s.pct.toFixed(1)}%)</span>
      </span>`
    ).join('');

    container.innerHTML = `
      <svg width="100%" height="${barHeight}" class="rounded overflow-hidden">${defs}${rects.join('')}</svg>
      <div class="flex gap-4 mt-2">${legend}</div>
    `;
  }
};
