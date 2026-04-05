// localStorage wrapper with TTL. Keys are namespaced under "argpt_cache:".
const Cache = {
  PREFIX: 'argpt_cache:',

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

  // Runs fn() unless the cache has a fresh value. Returns the cached or fresh value.
  async fetch(key, ttlMs, fn) {
    const cached = this.get(key);
    if (cached != null) return cached;
    const fresh = await fn();
    if (fresh != null) this.set(key, fresh, ttlMs);
    return fresh;
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
