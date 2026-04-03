const Chart = {
  COLORS: {
    cedear: '#58a6ff',
    arg_stock: '#3fb950',
    us_stock: '#d29922'
  },
  LABELS: {
    cedear: 'CEDEAR',
    arg_stock: 'Arg Stock',
    us_stock: 'US Stock'
  },

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
      color: this.COLORS[type] || '#8b949e',
      label: this.LABELS[type] || type
    }));

    const barHeight = 28;
    const width = 100;
    let x = 0;
    const rects = segments.map(s => {
      const w = (s.pct / 100) * width;
      const rect = `<rect x="${x}%" y="0" width="${w}%" height="${barHeight}" fill="${s.color}" rx="0"/>`;
      const textX = x + w / 2;
      const text = w > 8
        ? `<text x="${textX}%" y="${barHeight / 2 + 1}" text-anchor="middle" dominant-baseline="middle" fill="#0d1117" font-size="11" font-weight="600" font-family="IBM Plex Sans, sans-serif">${s.pct.toFixed(0)}%</text>`
        : '';
      x += w;
      return rect + text;
    });

    const legend = segments.map(s =>
      `<span class="flex items-center gap-1.5">
        <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:${s.color}"></span>
        <span class="text-xs">${s.label}</span>
        <span class="text-xs text-muted">${Currency.formatUSD(s.value)} (${s.pct.toFixed(1)}%)</span>
      </span>`
    ).join('');

    container.innerHTML = `
      <svg width="100%" height="${barHeight}" class="rounded overflow-hidden">${rects.join('')}</svg>
      <div class="flex gap-4 mt-2">${legend}</div>
    `;
  }
};
