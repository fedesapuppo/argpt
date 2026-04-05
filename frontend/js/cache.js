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
  }
};

if (typeof module !== 'undefined') module.exports = Cache;
