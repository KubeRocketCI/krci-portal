import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "./index.js";

describe("TtlCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads once and serves the cached value until the ttl expires", async () => {
    const cache = new TtlCache({ ttlMs: 1_000, maxEntries: 10 });
    const load = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    expect(await cache.getOrLoad("k", load)).toBe(1);
    expect(await cache.getOrLoad("k", load)).toBe(1);
    expect(load).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1_001);

    expect(await cache.getOrLoad("k", load)).toBe(2);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("shares one in-flight load between concurrent callers", async () => {
    const cache = new TtlCache({ ttlMs: 1_000, maxEntries: 10 });
    let resolveLoad: (value: string) => void = () => {};
    const load = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveLoad = resolve;
        })
    );

    const first = cache.getOrLoad("k", load);
    const second = cache.getOrLoad("k", load);
    resolveLoad("value");

    expect(await first).toBe("value");
    expect(await second).toBe("value");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not cache a rejected load", async () => {
    const cache = new TtlCache({ ttlMs: 1_000, maxEntries: 10 });
    const load = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(7);

    await expect(cache.getOrLoad("k", load)).rejects.toThrow("boom");
    expect(await cache.getOrLoad("k", load)).toBe(7);
  });

  it("keeps keys apart", async () => {
    const cache = new TtlCache({ ttlMs: 1_000, maxEntries: 10 });

    expect(await cache.getOrLoad("a", async () => "A")).toBe("A");
    expect(await cache.getOrLoad("b", async () => "B")).toBe("B");
  });

  it("drops the oldest entries beyond maxEntries", async () => {
    const cache = new TtlCache({ ttlMs: 1_000, maxEntries: 2 });
    const load = vi.fn(async () => "loaded");

    await cache.getOrLoad("a", load);
    await cache.getOrLoad("b", load);
    await cache.getOrLoad("c", load);
    expect(load).toHaveBeenCalledTimes(3);

    await cache.getOrLoad("b", load);
    await cache.getOrLoad("c", load);
    expect(load).toHaveBeenCalledTimes(3);

    await cache.getOrLoad("a", load);
    expect(load).toHaveBeenCalledTimes(4);
  });

  it("clear() forgets every entry", async () => {
    const cache = new TtlCache({ ttlMs: 1_000, maxEntries: 10 });
    const load = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await cache.getOrLoad("k", load);
    cache.clear();

    expect(await cache.getOrLoad("k", load)).toBe(2);
  });
});
