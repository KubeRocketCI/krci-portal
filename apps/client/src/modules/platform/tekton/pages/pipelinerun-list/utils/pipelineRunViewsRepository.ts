import { LS_KEY_PIPELINERUN_VIEWS } from "@/core/services/local-storage/keys";
import z from "zod";
import { PIPELINERUN_VIEW_ID_PREFIX, PIPELINERUN_VIEW_NAME_MAX_LENGTH } from "../constants";
import type { PipelineRunView, PipelineRunViewsStore } from "../types";
import { toPipelineRunViewFilters } from "./pipelineRunViewFilters";

/** Storage seam for saved views. The UI depends on this, not on localStorage. */
export interface PipelineRunViewsRepository {
  /** Never throws. Invalid entries are dropped. Returns the same reference while storage is unchanged. */
  read: () => PipelineRunViewsStore;
  /** Throws when storage rejects the write, e.g. quota exceeded. */
  write: (store: PipelineRunViewsStore) => void;
  subscribe: (listener: () => void) => () => void;
}

const storedViewSchema = z.object({
  id: z.string().startsWith(PIPELINERUN_VIEW_ID_PREFIX).max(128),
  name: z.string().trim().min(1).max(PIPELINERUN_VIEW_NAME_MAX_LENGTH),
  filters: z.record(z.unknown()).catch({}),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

// `clusters` is read from the parsed JSON directly: Zod records drop a `__proto__` key.
const storedEnvelopeSchema = z.object({ version: z.number() }).passthrough();

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Null prototype: cluster names such as `constructor` or `__proto__` stay plain keys. */
export const createPipelineRunViewsClusters = (
  entries: Record<string, PipelineRunView[]> = {}
): Record<string, PipelineRunView[]> => Object.assign(Object.create(null), entries);

export const createEmptyPipelineRunViewsStore = (): PipelineRunViewsStore => ({
  version: 1,
  clusters: createPipelineRunViewsClusters(),
});

export const getPipelineRunClusterViews = (
  store: PipelineRunViewsStore,
  clusterName: string
): PipelineRunView[] | undefined =>
  Object.hasOwn(store.clusters, clusterName) ? store.clusters[clusterName] : undefined;

export const parsePipelineRunViewsStore = (raw: string | null): PipelineRunViewsStore => {
  if (!raw) {
    return createEmptyPipelineRunViewsStore();
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return createEmptyPipelineRunViewsStore();
  }

  const envelope = storedEnvelopeSchema.safeParse(json);
  if (!envelope.success) {
    return createEmptyPipelineRunViewsStore();
  }

  if (envelope.data.version !== 1) {
    return { ...createEmptyPipelineRunViewsStore(), readOnly: true };
  }

  const clusters = createPipelineRunViewsClusters();

  const storedClusters = isPlainObject(envelope.data.clusters) ? envelope.data.clusters : {};

  for (const [clusterName, entries] of Object.entries(storedClusters)) {
    // A damaged cluster entry is dropped alone; the other clusters keep their views.
    if (!Array.isArray(entries)) {
      continue;
    }

    const seenIds = new Set<string>();
    const views: PipelineRunView[] = [];

    for (const entry of entries) {
      const parsed = storedViewSchema.safeParse(entry);
      if (!parsed.success || seenIds.has(parsed.data.id)) {
        continue;
      }
      seenIds.add(parsed.data.id);
      views.push({ ...parsed.data, filters: toPipelineRunViewFilters(parsed.data.filters) });
    }

    if (views.length > 0) {
      clusters[clusterName] = views;
    }
  }

  return { version: 1, clusters };
};

const readRaw = (): string | null => {
  try {
    return localStorage.getItem(LS_KEY_PIPELINERUN_VIEWS);
  } catch {
    return null;
  }
};

let cachedRaw: string | null | undefined;
let cachedStore: PipelineRunViewsStore = createEmptyPipelineRunViewsStore();
let listeners: Array<() => void> = [];

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const onStorage = (event: StorageEvent) => {
  // `key === null` is localStorage.clear() in another tab.
  if (event.key === LS_KEY_PIPELINERUN_VIEWS || event.key === null) {
    notify();
  }
};

export const localStoragePipelineRunViewsRepository: PipelineRunViewsRepository = {
  read: () => {
    const raw = readRaw();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedStore = parsePipelineRunViewsStore(raw);
    }
    return cachedStore;
  },
  write: (store) => {
    localStorage.setItem(LS_KEY_PIPELINERUN_VIEWS, JSON.stringify(store));
    notify();
  },
  subscribe: (listener) => {
    if (listeners.length === 0) {
      window.addEventListener("storage", onStorage);
    }
    listeners = [...listeners, listener];

    return () => {
      listeners = listeners.filter((l) => l !== listener);
      if (listeners.length === 0) {
        window.removeEventListener("storage", onStorage);
      }
    };
  },
};
