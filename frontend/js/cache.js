// localStorage wrapper with TTL and in-flight deduplication.
// Keys are namespaced under "argpt_cache:".
const Cache = {
  PREFIX: 'argpt_cache:',
  _pending: new Map(),

  get(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      if (!raw) return null;
      const { value, expires } = JSON.parse(raw);
      if (expires && Date.now() > expires) {
        localStorage.removeItem(this.PREFIX + key);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  },

  set(key, value, ttlMs) {
    try {
      const payload = { value, expires: ttlMs ? Date.now() + ttlMs : null };
      localStorage.setItem(this.PREFIX + key, JSON.stringify(payload));
    } catch {
      // quota exceeded or serialization error — silently drop
    }
  },

  // Runs fn() unless the cache has a fresh value. Deduplicates concurrent
  // calls for the same key so only one HTTP request fires.
  async fetch(key, ttlMs, fn) {
    const cached = this.get(key);
    if (cached != null) return cached;
    if (this._pending.has(key)) return this._pending.get(key);
    const promise = fn().then(fresh => {
      if (fresh != null) this.set(key, fresh, ttlMs);
      this._pending.delete(key);
      return fresh;
    }).catch(err => {
      this._pending.delete(key);
      throw err;
    });
    this._pending.set(key, promise);
    return promise;
  },

  // Removes every cache entry in our namespace. Leaves unrelated
  // localStorage keys alone.
  clearAll() {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  }
};

export default Cache;
