export interface TtlCacheOptions {
  ttlMs: number;
  /** Oldest entries are dropped beyond this size. */
  maxEntries: number;
}

interface Entry<V> {
  value: V;
  expiresAt: number;
}

/**
 * In-process cache with a fixed time-to-live. Concurrent loads of one key share a single in-flight
 * promise. A rejected load is not cached.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, Entry<V>>();
  private readonly inflight = new Map<string, Promise<V>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor({ ttlMs, maxEntries }: TtlCacheOptions) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  async getOrLoad(key: string, load: () => Promise<V>): Promise<V> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const pending = this.inflight.get(key);
    if (pending) {
      return pending;
    }

    const loading = load()
      .then((value) => {
        this.store(key, value);
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });
    this.inflight.set(key, loading);

    return loading;
  }

  clear(): void {
    this.entries.clear();
  }

  private store(key: string, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });

    for (const oldestKey of this.entries.keys()) {
      if (this.entries.size <= this.maxEntries) {
        break;
      }
      this.entries.delete(oldestKey);
    }
  }
}
