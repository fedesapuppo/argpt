const test = require('node:test');
const assert = require('node:assert/strict');
const LiveData = require('../../../frontend/js/api/live_data.js');

test('_uniqueHoldings de-dupes by ticker', () => {
  const result = LiveData._uniqueHoldings([
    { ticker: 'AAPL', type: 'cedear' },
    { ticker: 'AAPL', type: 'cedear' },
    { ticker: 'GGAL', type: 'arg_stock' }
  ]);
  assert.deepEqual(result.map(h => h.ticker), ['AAPL', 'GGAL']);
});

test('_uniqueHoldings ignores entries without a ticker', () => {
  const result = LiveData._uniqueHoldings([
    { ticker: null, type: 'cedear' },
    { ticker: 'AAPL', type: 'cedear' }
  ]);
  assert.deepEqual(result.map(h => h.ticker), ['AAPL']);
});

test('_uniqueHoldings handles empty and null input', () => {
  assert.deepEqual(LiveData._uniqueHoldings([]), []);
  assert.deepEqual(LiveData._uniqueHoldings(null), []);
});

test('_preferNonEmpty returns fresh when it has keys', () => {
  const fresh = { 'AAPL:cedear': { last: 100 } };
  const fallback = { 'OLD:cedear': { last: 50 } };
  assert.equal(LiveData._preferNonEmpty(fresh, fallback), fresh);
});

test('_preferNonEmpty returns fallback when fresh is empty', () => {
  const fallback = { 'OLD:cedear': { last: 50 } };
  assert.equal(LiveData._preferNonEmpty({}, fallback), fallback);
});

test('_preferNonEmpty returns fallback when fresh is null', () => {
  const fallback = { a: 1 };
  assert.equal(LiveData._preferNonEmpty(null, fallback), fallback);
});

test('_preferNonEmpty returns empty object when both are absent', () => {
  assert.deepEqual(LiveData._preferNonEmpty(null, null), {});
});

test('_mergeRates returns null when both are missing', () => {
  assert.equal(LiveData._mergeRates(null, null), null);
});

test('_mergeRates prefers fresh mep/ccl over fallback', () => {
  const fresh = {
    mep: { ticker: 'AL30', mark: 1500 },
    ccl: { ticker: 'AL30', mark: 1550 },
    fetched_at: '2026-04-05T12:00:00Z'
  };
  const fallback = {
    mep: { ticker: 'GD30', mark: 1400 },
    ccl: null,
    fetched_at: '2026-04-03T12:00:00Z'
  };
  const result = LiveData._mergeRates(fresh, fallback);
  assert.equal(result.mep.mark, 1500);
  assert.equal(result.ccl.mark, 1550);
  assert.equal(result.fetched_at, '2026-04-05T12:00:00Z');
});

test('_mergeRates falls back per-key when fresh has empty fields (weekend case)', () => {
  const fresh = { mep: null, ccl: null, fetched_at: '2026-04-05T12:00:00Z' };
  const fallback = {
    mep: { ticker: 'AL30', mark: 1415 },
    ccl: { ticker: 'AL30', mark: 1435 },
    fetched_at: '2026-04-03T12:00:00Z'
  };
  const result = LiveData._mergeRates(fresh, fallback);
  assert.equal(result.mep.mark, 1415);
  assert.equal(result.ccl.mark, 1435);
  // fresh's fetched_at wins because it's present
  assert.equal(result.fetched_at, '2026-04-05T12:00:00Z');
});

test('_mergeRates uses fallback entirely when fresh is missing', () => {
  const fallback = {
    mep: { ticker: 'AL30', mark: 1415 },
    ccl: { ticker: 'AL30', mark: 1435 },
    fetched_at: '2026-04-03T12:00:00Z'
  };
  const result = LiveData._mergeRates(null, fallback);
  assert.equal(result.mep.mark, 1415);
  assert.equal(result.fetched_at, '2026-04-03T12:00:00Z');
});
