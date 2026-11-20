export interface TtlCacheOptions {
  ttlMs: number;
  /** Oldest entries are dropped beyond this size. */
  maxEntries: number;
}

interface Entry {
  value: unknown;
  expiresAt: number;
}

/**
 * In-process cache with a fixed time-to-live. Concurrent loads of one key share a single in-flight
 * promise. A rejected load is not cached.
 *
 * One instance holds values of different types: a key must always be loaded with the same type.
 */
export class TtlCache {
  private readonly entries = new Map<string, Entry>();
  private readonly inflight = new Map<string, Promise<unknown>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor({ ttlMs, maxEntries }: TtlCacheOptions) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  async getOrLoad<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const pending = this.inflight.get(key);
    if (pending) {
      return pending as Promise<T>;
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

  private store(key: string, value: unknown): void {
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
