const test = require('node:test');
const assert = require('node:assert/strict');
const Data912 = require('../../../frontend/js/api/data912.js');

test('_toPrice normalizes a data912 row for arg_stock', () => {
  const row = { symbol: 'GGAL', c: 5200.0, pct_change: 2.5, v: 1500000 };
  const price = Data912._toPrice(row, 'arg_stock');
  assert.deepEqual(price, {
    last: 5200.0, change: 2.5, volume: 1500000, currency: 'ars', type: 'arg_stock'
  });
});

test('_toPrice marks us_stock rows with usd currency', () => {
  const row = { symbol: 'AAPL', c: 255.92, pct_change: 0.11, v: 31289369 };
  const price = Data912._toPrice(row, 'us_stock');
  assert.equal(price.currency, 'usd');
  assert.equal(price.type, 'us_stock');
});

test('_toPrice defaults missing volume and change to 0', () => {
  const row = { symbol: 'X', c: 10 };
  const price = Data912._toPrice(row, 'cedear');
  assert.equal(price.change, 0);
  assert.equal(price.volume, 0);
});

test('_toPrice falls back to last/change/volume keys if provided', () => {
  const row = { symbol: 'X', last: 20, change: 1.5, volume: 1000 };
  const price = Data912._toPrice(row, 'cedear');
  assert.equal(price.last, 20);
  assert.equal(price.change, 1.5);
  assert.equal(price.volume, 1000);
});

test('_bestRate returns null for empty input', () => {
  assert.equal(Data912._bestRate([]), null);
  assert.equal(Data912._bestRate(null), null);
  assert.equal(Data912._bestRate(undefined), null);
});

test('_bestRate prefers the AL30 entry', () => {
  const rows = [
    { ticker: 'GD30', bid: 1400, ask: 1410, mark: 1405 },
    { ticker: 'AL30', bid: 1410, ask: 1420, mark: 1415 }
  ];
  const result = Data912._bestRate(rows);
  assert.equal(result.ticker, 'AL30');
  assert.equal(result.mark, 1415);
});

test('_bestRate falls back to first entry when AL30 is missing', () => {
  const rows = [{ ticker: 'GD30', bid: 1400, ask: 1410, mark: 1405 }];
  const result = Data912._bestRate(rows);
  assert.equal(result.ticker, 'GD30');
  assert.equal(result.mark, 1405);
});

test('_bestRate reads buy/sell/rate aliases', () => {
  const rows = [{ ticker: 'AL30', buy: 1400, sell: 1410, rate: 1405 }];
  const result = Data912._bestRate(rows);
  assert.equal(result.bid, 1400);
  assert.equal(result.ask, 1410);
  assert.equal(result.mark, 1405);
});
