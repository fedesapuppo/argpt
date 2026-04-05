const test = require('node:test');
const assert = require('node:assert/strict');

// Shim localStorage for Node before requiring Cache.
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  key: (i) => Object.keys(store)[i] ?? null,
  get length() { return Object.keys(store).length; }
};

const Cache = require('../../frontend/js/cache.js');

test.beforeEach(() => global.localStorage.clear());

test('returns null for missing key', () => {
  assert.equal(Cache.get('missing'), null);
});

test('stores and retrieves a value', () => {
  Cache.set('foo', { a: 1 }, 10_000);
  assert.deepEqual(Cache.get('foo'), { a: 1 });
});

test('expires a value after its TTL', () => {
  Cache.set('foo', { a: 1 }, 10_000);
  // Manually rewrite the stored payload so its expiry is in the past.
  const key = Cache.PREFIX + 'foo';
  const payload = JSON.parse(global.localStorage.getItem(key));
  payload.expires = Date.now() - 1;
  global.localStorage.setItem(key, JSON.stringify(payload));

  assert.equal(Cache.get('foo'), null);
  // expired entry should be removed
  assert.equal(global.localStorage.getItem(key), null);
});

test('null ttl means no expiration', () => {
  Cache.set('forever', 'value', null);
  assert.equal(Cache.get('forever'), 'value');
});

test('namespaces keys under argpt_cache:', () => {
  Cache.set('k', 'v', 1000);
  assert.ok(global.localStorage.getItem('argpt_cache:k'));
});

test('fetch returns cached value without calling fn', async () => {
  Cache.set('k', 'cached', 10_000);
  let called = false;
  const result = await Cache.fetch('k', 10_000, async () => { called = true; return 'fresh'; });
  assert.equal(result, 'cached');
  assert.equal(called, false);
});

test('fetch calls fn and stores when cache is empty', async () => {
  const result = await Cache.fetch('k', 10_000, async () => 'fresh');
  assert.equal(result, 'fresh');
  assert.equal(Cache.get('k'), 'fresh');
});

test('fetch does not store null results', async () => {
  const result = await Cache.fetch('k', 10_000, async () => null);
  assert.equal(result, null);
  assert.equal(Cache.get('k'), null);
});

test('clearAll removes every argpt_cache: key', () => {
  Cache.set('a', 1, 10_000);
  Cache.set('b', 2, 10_000);
  Cache.set('c', 3, 10_000);
  Cache.clearAll();
  assert.equal(Cache.get('a'), null);
  assert.equal(Cache.get('b'), null);
  assert.equal(Cache.get('c'), null);
});

test('clearAll leaves non-argpt keys alone', () => {
  Cache.set('mine', 'yes', 10_000);
  global.localStorage.setItem('unrelated', 'keep me');
  Cache.clearAll();
  assert.equal(global.localStorage.getItem('unrelated'), 'keep me');
});
