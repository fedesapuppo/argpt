const Export = {
  init() {
    const btn = document.getElementById('export-csv');
    if (btn) btn.addEventListener('click', () => this.downloadCSV());
  },

  downloadCSV() {
    const holdings = Table._portfolioData;
    if (!holdings || !holdings.length) { Toast.info('No data to export'); return; }

    const filtered = holdings.filter(h => Filter.matches(h.type));
    if (!filtered.length) { Toast.info('No holdings match current filter'); return; }

    const headers = ['Ticker', 'Type', 'Broker', 'Shares', 'Avg ARS', 'Avg USD', 'Price USD', 'Price %', 'Currency %', 'USD Ret %', 'Value USD', 'USD P&L', 'Weight %'];
    const rows = filtered.map(h => [
      h.ticker, h.type, h.broker || '',
      h.shares, h.avg_price, h.cost_basis_usd ?? '',
      h.current_price_usd ?? '',
      h.capital_return_pct != null ? h.capital_return_pct.toFixed(2) : '',
      h.currency_return_pct != null ? h.currency_return_pct.toFixed(2) : '',
      h.total_return_usd_pct != null ? h.total_return_usd_pct.toFixed(2) : '',
      h.value_usd ?? '', h.pnl_usd ?? '',
      h.weight_pct != null ? h.weight_pct.toFixed(2) : ''
    ]);

    const csvCell = (v) => {
      const s = String(v);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argpt-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('Portfolio exported');
  }
};
