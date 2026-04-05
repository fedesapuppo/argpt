const Import = {
  TYPE_MAP: { 'Cedears': 'cedear', 'Acciones': 'arg_stock' },
  SHEET: 'resultados_por_lotes_finales',

  init() {
    this._bindInput('import-balanz', (file) => this._processBalanz(file));
    this._bindInput('import-ib', (file) => this._processIB(file));

    const sampleBtn = document.getElementById('load-sample');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        Storage.saveHoldings(this._sampleHoldings());
        App._sampleMode = true;
        App.fetchForHoldings(this._sampleHoldings());
        App.refresh();
        Toast.success(I18n.t('import.sample_loaded'));
      });
    }

    const clearBtn = document.getElementById('clear-holdings');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!confirm(I18n.t('import.clear_confirm'))) return;
        localStorage.removeItem('argpt_holdings');
        App._sampleMode = false;
        App.refresh();
        Toast.info(I18n.t('import.cleared'));
      });
    }
  },

  _bindInput(id, handler) {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handler(file);
      input.value = '';
    });
  },

  _processBalanz(file) {
    Toast.info(I18n.t('import.reading'));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[this.SHEET];

        if (!sheet) {
          Toast.error(I18n.t('import.sheet_not_found', { sheet: this.SHEET, sheets: wb.SheetNames.join(', ') }));
          return;
        }

        const rows = XLSX.utils.sheet_to_json(sheet);
        const holdings = this._perLotHoldings(rows);

        Storage.mergeHoldings(holdings, 'balanz');
        App._sampleMode = false;
        App.refresh();
        App.fetchForHoldings(holdings);

        Toast.success(I18n.t('import.balanz_success', { count: holdings.length }));
      } catch (err) {
        Toast.error(`Error: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  },

  _processIB(file) {
    Toast.info(I18n.t('import.reading'));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const holdings = this._parseIB(e.target.result);
        Storage.mergeHoldings(holdings, 'ib');
        App._sampleMode = false;
        App.refresh();
        App.fetchForHoldings(holdings);
        Toast.success(I18n.t('import.ib_success', { count: holdings.length }));
      } catch (err) {
        Toast.error(`Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  },

  _parseIB(text) {
    const lines = text.split('\n');
    const holdings = [];

    for (const line of lines) {
      const cols = [];
      let current = '';
      let inQuotes = false;

      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; continue; }
        current += ch;
      }
      cols.push(current.trim());

      if (cols[0] !== 'Open Positions') continue;
      if (cols[1] !== 'Data' || cols[2] !== 'Summary') continue;
      if (cols[3] !== 'Stocks') continue;

      const ticker = cols[5];
      const shares = parseFloat(cols[6]);
      const avgPrice = parseFloat(cols[8]);

      if (!ticker || !shares || !avgPrice) continue;

      holdings.push({
        ticker,
        type: 'us_stock',
        shares,
        avg_price: Math.round(avgPrice * 100) / 100,
        purchase_date: null,
        entry_fx_rate: null,
        broker: 'ib'
      });
    }

    return holdings;
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
      const maxPrice = Math.max(...tickerLots.map(l => l.price));
      const threshold = maxPrice * 0.01;
      const paid = tickerLots.filter(l => l.price > threshold);
      const free = tickerLots.filter(l => l.price <= threshold);
      const freeShares = free.reduce((s, l) => s + l.qty, 0);

      if (paid.length === 0) {
        if (freeShares > 0) {
          holdings.push({
            ticker, type: tickerLots[0].type,
            shares: freeShares, avg_price: 0.01,
            purchase_date: null, entry_fx_rate: null,
            broker: 'balanz'
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
          entry_fx_rate: lot.mep > 0 ? Math.round(lot.mep * 100) / 100 : null,
          broker: 'balanz'
        });
      }
    }

    return holdings;
  },

  _sampleHoldings() {
    const h = (ticker, type, shares, avg_price, broker, entry_fx_rate) => ({
      ticker, type, shares, avg_price,
      purchase_date: null,
      entry_fx_rate: entry_fx_rate || null,
      broker: broker || (type === 'us_stock' ? 'ib' : 'balanz')
    });
    return [
      h('AAPL',  'cedear',    50, 15000, 'balanz', 1350),
      h('GOOGL', 'cedear',    30, 6200,  'balanz', 1300),
      h('MELI',  'cedear',    10, 18000, 'balanz', 1350),
      h('NVDA',  'cedear',    40, 7500,  'balanz', 1250),
      h('MSFT',  'cedear',    20, 15000, 'balanz', 1300),
      h('GGAL',  'arg_stock', 200, 5200, 'balanz', 1300),
      h('YPFD',  'arg_stock', 50, 48000, 'balanz', 1280),
      h('TXAR',  'arg_stock', 300, 580,  'balanz', 1300),
      h('PAMP',  'arg_stock', 100, 3800, 'balanz', 1280),
      h('TSLA',  'us_stock',  5,   280),
      h('AVGO',  'us_stock',  2,   250),
      h('QQQ',   'us_stock',  10,  480),
    ];
  }
};
