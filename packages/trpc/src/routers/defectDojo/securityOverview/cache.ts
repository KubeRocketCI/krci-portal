import { OutageFound, isOutage, outageOf, type DefectDojoResult } from "../../../clients/defectDojo/index.js";
import { TtlCache } from "../../../utils/ttlCache/index.js";

/** How long one read of DefectDojo serves every caller. */
export const SECURITY_OVERVIEW_CACHE_TTL_MS = 60_000;

const SECURITY_OVERVIEW_CACHE_MAX_ENTRIES = 16;

const caches: { clear(): void }[] = [];

export interface OverviewCache<T> {
  /**
   * The result of `read` under `key`, read once per TTL for every caller. An outage, returned or thrown as
   * `OutageFound`, is answered and never kept.
   */
  read(key: string, read: () => Promise<DefectDojoResult<T>>): Promise<DefectDojoResult<T>>;
}

/**
 * A cache of the overview's DefectDojo reads. One value serves every caller: the portal reads DefectDojo with one
 * token, and the value holds no Kubernetes data.
 */
export function createOverviewCache<T>(): OverviewCache<T> {
  const cache = new TtlCache<DefectDojoResult<T>>({
    ttlMs: SECURITY_OVERVIEW_CACHE_TTL_MS,
    maxEntries: SECURITY_OVERVIEW_CACHE_MAX_ENTRIES,
  });
  caches.push(cache);

  return {
    async read(key, read) {
      try {
        return await cache.getOrLoad(key, async () => {
          const result = await read();
          if (isOutage(result)) {
            throw new OutageFound(result);
          }
          return result;
        });
      } catch (error) {
        return outageOf(error);
      }
    },
  };
}

export function clearSecurityOverviewCache(): void {
  caches.forEach((cache) => cache.clear());
}
