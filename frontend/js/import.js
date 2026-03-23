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
        const holdings = this._perLotHoldings(rows);

        Storage.saveHoldings(holdings);
        App.refresh();

        status.textContent = `Imported ${holdings.length} holdings (per-lot)`;
        status.className = 'self-center text-xs text-gain';
      } catch (err) {
        status.textContent = `Error: ${err.message}`;
        status.className = 'self-center text-xs text-loss';
      }
    };
    reader.readAsArrayBuffer(file);
  },

  _perLotHoldings(rows) {
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

    const holdings = [];

    for (const [ticker, tickerLots] of Object.entries(byTicker)) {
      const paid = tickerLots.filter(l => l.price > 0);
      const free = tickerLots.filter(l => l.price <= 0);
      const freeShares = free.reduce((s, l) => s + l.qty, 0);

      if (paid.length === 0) {
        if (freeShares > 0) {
          holdings.push({
            ticker, type: tickerLots[0].type,
            shares: freeShares, avg_price: 0.01,
            purchase_date: null, entry_fx_rate: null
          });
        }
        continue;
      }

      const extraPerLot = freeShares / paid.length;

      for (const lot of paid) {
        const newShares = lot.qty + extraPerLot;
        const adjustedPrice = lot.price * lot.qty / newShares;
        holdings.push({
          ticker,
          type: lot.type,
          shares: newShares,
          avg_price: Math.round(adjustedPrice * 100) / 100,
          purchase_date: lot.date,
          entry_fx_rate: lot.mep > 0 ? Math.round(lot.mep * 100) / 100 : null
        });
      }
    }

    return holdings;
  }
};
