const Import = {
  TYPE_MAP: { 'Cedears': 'cedear', 'Acciones': 'arg_stock' },
  SHEET: 'resultados_por_lotes_finales',

  init() {
    const input = document.getElementById('import-file');
    if (!input) return;

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this._processFile(file);
      input.value = '';
    });
  },

  _processFile(file) {
    const status = document.getElementById('import-status');
    status.textContent = 'Reading...';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[this.SHEET];

        if (!sheet) {
          status.textContent = `Sheet "${this.SHEET}" not found. Sheets: ${wb.SheetNames.join(', ')}`;
          status.className = 'self-center text-xs text-loss';
          return;
        }

        const rows = XLSX.utils.sheet_to_json(sheet);
        const holdings = this._aggregate(rows);

        Storage.saveHoldings(holdings);
        App.refresh();

        status.textContent = `Imported ${holdings.length} holdings`;
        status.className = 'self-center text-xs text-gain';
      } catch (err) {
        status.textContent = `Error: ${err.message}`;
        status.className = 'self-center text-xs text-loss';
      }
    };
    reader.readAsArrayBuffer(file);
  },

  _aggregate(rows) {
    const lots = rows
      .filter(r => this.TYPE_MAP[r['Tipo']])
      .map(r => ({
        ticker: r['Ticker'],
        type: this.TYPE_MAP[r['Tipo']],
        qty: parseFloat(r['Cantidad']) || 0,
        price: parseFloat(r['Precio Compra']) || 0,
        date: r['Fecha'] ? String(r['Fecha']).slice(0, 10) : null,
        mep: parseFloat(r['DolarMEP']) || 0
      }));

    const byTicker = {};
    for (const lot of lots) {
      if (!byTicker[lot.ticker]) byTicker[lot.ticker] = [];
      byTicker[lot.ticker].push(lot);
    }

    return Object.entries(byTicker).map(([ticker, tickerLots]) => {
      const paid = tickerLots.filter(l => l.price > 0);
      const totalShares = tickerLots.reduce((s, l) => s + l.qty, 0);
      if (totalShares <= 0) return null;

      let avgPrice = 0.01;
      let avgMep = null;
      let purchaseDate = null;

      if (paid.length > 0) {
        const paidShares = paid.reduce((s, l) => s + l.qty, 0);
        avgPrice = paid.reduce((s, l) => s + l.qty * l.price, 0) / paidShares;
        const weightedMep = paid.reduce((s, l) => s + l.qty * l.mep, 0) / paidShares;
        avgMep = weightedMep > 0 ? Math.round(weightedMep * 100) / 100 : null;
        const dates = paid.map(l => l.date).filter(Boolean).sort();
        purchaseDate = dates[0] || null;
      }

      return {
        ticker,
        type: tickerLots[0].type,
        shares: totalShares,
        avg_price: Math.round(avgPrice * 100) / 100,
        purchase_date: purchaseDate,
        entry_fx_rate: avgMep
      };
    }).filter(Boolean);
  }
};
