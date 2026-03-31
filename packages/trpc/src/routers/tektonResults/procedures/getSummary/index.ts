import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";
import { DEFAULT_SUMMARY_METRICS, TektonSummaryResponse } from "@my-project/shared";
import { tektonInputSchemas } from "../../utils.js";

/**
 * Server-side TTL cache for getSummary results with singleflight coalescing.
 *
 * Two-layer protection against DB saturation:
 * 1. Settled cache: serves results for CACHE_TTL_MS after the last fetch.
 * 2. In-flight map: coalesces concurrent requests that arrive while a fetch is
 *    already running (thundering-herd / cache-stampede prevention). All callers
 *    that arrive during the in-flight window await the same Promise and receive
 *    the result without triggering additional DB queries.
 *
 * Eviction uses LRU order: Map insertion order is maintained, and a cache hit
 * moves the entry to the tail so the head is always the least-recently-used key.
 */
const CACHE_TTL_MS = 55_000;
const CACHE_MAX_ENTRIES = 200;
const CACHE_EVICT_COUNT = 20;

interface SummaryCacheEntry {
  data: TektonSummaryResponse;
  cachedAt: number;
}

// Settled results cache (LRU via Map insertion order)
const summaryCache = new Map<string, SummaryCacheEntry>();
const inflight = new Map<string, Promise<TektonSummaryResponse>>();

export function clearSummaryCache(): void {
  summaryCache.clear();
  inflight.clear();
}

function buildCacheKey(
  userSub: string,
  namespace: string,
  summary: string,
  groupBy: string | undefined,
  filter: string | undefined,
  orderBy: string | undefined
): string {
  // JSON.stringify produces an unambiguous key: any field value that contains the
  // separator character (e.g. ":" in OIDC sub claims or CEL timestamp literals)
  // cannot collide with a different combination of fields.
  return JSON.stringify([userSub, namespace, summary, groupBy ?? "", filter ?? "", orderBy ?? ""]);
}

function getFromCache(key: string): TektonSummaryResponse | null {
  const entry = summaryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    summaryCache.delete(key);
    return null;
  }
  // LRU: move accessed entry to tail
  summaryCache.delete(key);
  summaryCache.set(key, entry);
  return entry.data;
}

function setInCache(key: string, data: TektonSummaryResponse): void {
  // LRU eviction: head of Map is least-recently-used
  if (summaryCache.size >= CACHE_MAX_ENTRIES) {
    const keys = summaryCache.keys();
    for (let i = 0; i < CACHE_EVICT_COUNT; i++) {
      const next = keys.next();
      if (next.done) break;
      summaryCache.delete(next.value);
    }
  }
  summaryCache.set(key, { data, cachedAt: Date.now() });
}

/**
 * Valid summary metric names per Tekton Results API
 * @see aggregator.go summaryFuncs map
 */
const VALID_SUMMARY_METRICS = [
  "total",
  "succeeded",
  "failed",
  "cancelled",
  "running",
  "others",
  "avg_duration",
  "min_duration",
  "max_duration",
  "total_duration",
  "last_runtime",
] as const;

/**
 * Valid group_by values per Tekton Results API
 * @see aggregator.go validGroups map
 */
const VALID_GROUP_BY = [
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
  "pipeline",
  "namespace",
  "repository",
] as const;

/**
 * Valid time fields for time-based grouping
 */
const VALID_TIME_FIELDS = ["startTime", "completionTime"] as const;

/**
 * Validates summary parameter format (comma-separated valid metrics)
 */
const summarySchema = z
  .string()
  .optional()
  .default(DEFAULT_SUMMARY_METRICS)
  .refine(
    (val) => {
      const metrics = val.split(",").map((m) => m.trim());
      return metrics.every((m) => VALID_SUMMARY_METRICS.includes(m as (typeof VALID_SUMMARY_METRICS)[number]));
    },
    {
      message: `Invalid summary metric. Valid values: ${VALID_SUMMARY_METRICS.join(", ")}`,
    }
  );

/**
 * Validates groupBy parameter format
 * Accepts: "hour", "day", "week", "pipeline", "hour startTime", "day completionTime", etc.
 */
const groupBySchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const parts = val.trim().split(" ");
      if (parts.length === 0 || parts.length > 2) return false;

      const groupBy = parts[0];
      if (!VALID_GROUP_BY.includes(groupBy as (typeof VALID_GROUP_BY)[number])) {
        return false;
      }

      // If time field specified, validate it
      if (parts.length === 2) {
        const timeField = parts[1];
        // Time field only valid for time-based grouping
        const isTimeGroup = ["minute", "hour", "day", "week", "month", "year"].includes(groupBy);
        if (!isTimeGroup) return false;
        if (!VALID_TIME_FIELDS.includes(timeField as (typeof VALID_TIME_FIELDS)[number])) {
          return false;
        }
      }

      return true;
    },
    {
      message: `Invalid groupBy. Valid values: ${VALID_GROUP_BY.join(", ")}. Time groups can include time field: "hour startTime"`,
    }
  );

/**
 * Validates orderBy parameter format: "field ASC|DESC"
 */
const orderBySchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const match = val.trim().match(/^(\w+)\s+(ASC|DESC|asc|desc)$/i);
      if (!match) return false;

      const field = match[1];
      return VALID_SUMMARY_METRICS.includes(field as (typeof VALID_SUMMARY_METRICS)[number]);
    },
    {
      message: `Invalid orderBy. Format: "field ASC|DESC" where field is a valid summary metric`,
    }
  );

export const getSummaryProcedure = protectedProcedure
  .input(
    z.object({
      namespace: tektonInputSchemas.namespace,
      summary: summarySchema,
      groupBy: groupBySchema,
      filter: z
        .string()
        .optional()
        .refine(
          (val) => {
            if (!val) return true;
            // Allow CEL expression characters; reject shell metacharacters and backticks
            return /^[a-zA-Z0-9\s_.\[\]()'",!=<>&|+\-*/%:]+$/.test(val);
          },
          { message: "Invalid filter: contains disallowed characters" }
        ),
      orderBy: orderBySchema,
    })
  )
  .query(async ({ input, ctx }) => {
    const { namespace, summary, groupBy, filter, orderBy } = input;
    const userSub = ctx.session.user?.data?.sub ?? "anonymous";

    const cacheKey = buildCacheKey(userSub, namespace, summary, groupBy, filter, orderBy);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    if (inflight.has(cacheKey)) {
      return inflight.get(cacheKey)!;
    }

    const pending = (async () => {
      const client = createTektonResultsClient(namespace);
      return client.getSummary({ summary, groupBy, filter, orderBy });
    })();

    inflight.set(cacheKey, pending);

    try {
      const result = await pending;
      setInCache(cacheKey, result);
      return result;
    } finally {
      inflight.delete(cacheKey);
    }
  });
