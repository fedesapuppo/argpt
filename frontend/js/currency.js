const Currency = {
  formatUSD(value) {
    if (value == null || typeof value !== 'number' || isNaN(value)) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(value);
  },

  formatARS(value) {
    if (value == null || typeof value !== 'number' || isNaN(value)) return '--';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value);
  },

  formatPct(value) {
    if (value == null || typeof value !== 'number' || isNaN(value)) return '--';
    const sign = value >= 0 ? '+' : '';
    const abs = Math.abs(value);
    if (abs >= 10000) return `${sign}${(value / 1000).toFixed(0)}K%`;
    if (abs >= 1000) return `${sign}${(value / 1000).toFixed(1)}K%`;
    return `${sign}${value.toFixed(2)}%`;
  },

  formatNum(value, decimals = 2) {
    if (value == null || typeof value !== 'number' || isNaN(value)) return '--';
    return value.toFixed(decimals);
  },

  pctClass(value) {
    if (value == null || typeof value !== 'number') return 'text-muted';
    if (value > 0) return 'text-gain';
    if (value < 0) return 'text-loss';
    return 'text-white';
  },

  thresholdClass(threshold) {
    if (!threshold) return '';
    const map = { green: 'text-gain', yellow: 'text-caution', red: 'text-loss' };
    return map[threshold] || '';
  },

  pctArrow(value) {
    if (value == null || typeof value !== 'number' || isNaN(value)) return '';
    if (value > 0) return '▲ ';
    if (value < 0) return '▼ ';
    return '';
  },

  thresholdArrow(threshold) {
    if (threshold === 'green') return '▲ ';
    if (threshold === 'red') return '▼ ';
    return '';
  }
};

export default Currency;
