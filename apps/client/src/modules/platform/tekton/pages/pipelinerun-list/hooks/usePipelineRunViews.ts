import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createRandomString } from "@my-project/shared";
import {
  PIPELINERUN_VIEW_ID_PREFIX,
  PIPELINERUN_VIEW_NAME_MAX_LENGTH,
  PIPELINERUN_VIEWS_MAX_PER_CLUSTER,
} from "../constants";
import type { PipelineRunView, PipelineRunViewFilters } from "../types";
import { toPipelineRunViewFilters } from "../utils/pipelineRunViewFilters";
import {
  createPipelineRunViewsClusters,
  getPipelineRunClusterViews,
  localStoragePipelineRunViewsRepository,
  type PipelineRunViewsRepository,
} from "../utils/pipelineRunViewsRepository";

export type PipelineRunViewMutationError =
  | "limit"
  | "duplicate-name"
  | "invalid-name"
  | "not-found"
  | "storage"
  | "unsupported-version";

export type PipelineRunViewMutationResult =
  | { ok: true; view: PipelineRunView }
  | { ok: false; error: PipelineRunViewMutationError };

const EMPTY_VIEWS: PipelineRunView[] = [];

const VIEW_ID_RANDOM_LENGTH = 8;

/** Random, so a deleted view's id is not handed out in sequence again. Retried until unique in the cluster. */
const createViewId = (views: PipelineRunView[]): string => {
  for (;;) {
    const id = `${PIPELINERUN_VIEW_ID_PREFIX}${createRandomString(VIEW_ID_RANDOM_LENGTH)}`;
    if (!views.some((view) => view.id === id)) {
      return id;
    }
  }
};

export const normalizePipelineRunViewName = (name: string): string => name.trim();

export const isPipelineRunViewNameTaken = (views: PipelineRunView[], name: string, exceptId?: string): boolean => {
  const normalized = normalizePipelineRunViewName(name).toLowerCase();
  return views.some((view) => view.id !== exceptId && view.name.toLowerCase() === normalized);
};

/**
 * Saved PipelineRun views of one cluster.
 * Every mutation re-reads storage before writing, so changes made in other tabs are kept.
 */
export function usePipelineRunViews(
  clusterName: string,
  repository: PipelineRunViewsRepository = localStoragePipelineRunViewsRepository
) {
  const store = useSyncExternalStore(repository.subscribe, repository.read);
  const views = getPipelineRunClusterViews(store, clusterName) ?? EMPTY_VIEWS;

  const mutate = useCallback(
    (change: (views: PipelineRunView[]) => PipelineRunViewMutationResult): PipelineRunViewMutationResult => {
      const current = repository.read();
      if (current.readOnly) {
        return { ok: false, error: "unsupported-version" };
      }

      // structuredClone drops the null prototype; rebuild it.
      const next = structuredClone(current);
      next.clusters = createPipelineRunViewsClusters(next.clusters);
      const clusterViews = getPipelineRunClusterViews(next, clusterName) ?? [];
      const result = change(clusterViews);

      if (!result.ok) {
        return result;
      }

      if (clusterViews.length > 0) {
        next.clusters[clusterName] = clusterViews;
      } else {
        delete next.clusters[clusterName];
      }

      try {
        repository.write(next);
      } catch {
        return { ok: false, error: "storage" };
      }

      return result;
    },
    [repository, clusterName]
  );

  const create = useCallback(
    (name: string, filters: PipelineRunViewFilters) =>
      mutate((clusterViews) => {
        const normalizedName = normalizePipelineRunViewName(name);
        if (!normalizedName || normalizedName.length > PIPELINERUN_VIEW_NAME_MAX_LENGTH) {
          return { ok: false, error: "invalid-name" };
        }
        if (clusterViews.length >= PIPELINERUN_VIEWS_MAX_PER_CLUSTER) return { ok: false, error: "limit" };
        if (isPipelineRunViewNameTaken(clusterViews, normalizedName)) return { ok: false, error: "duplicate-name" };

        const now = Date.now();
        const view: PipelineRunView = {
          id: createViewId(clusterViews),
          name: normalizedName,
          filters: toPipelineRunViewFilters(filters),
          createdAt: now,
          updatedAt: now,
        };
        clusterViews.push(view);
        return { ok: true, view };
      }),
    [mutate]
  );

  const update = useCallback(
    (id: string, changes: { name?: string; filters?: PipelineRunViewFilters }) =>
      mutate((clusterViews) => {
        const view = clusterViews.find((item) => item.id === id);
        if (!view) return { ok: false, error: "not-found" };

        if (changes.name !== undefined) {
          const normalizedName = normalizePipelineRunViewName(changes.name);
          if (!normalizedName || normalizedName.length > PIPELINERUN_VIEW_NAME_MAX_LENGTH) {
            return { ok: false, error: "invalid-name" };
          }
          if (isPipelineRunViewNameTaken(clusterViews, normalizedName, id)) {
            return { ok: false, error: "duplicate-name" };
          }
          view.name = normalizedName;
        }

        if (changes.filters !== undefined) {
          view.filters = toPipelineRunViewFilters(changes.filters);
        }

        view.updatedAt = Date.now();
        return { ok: true, view };
      }),
    [mutate]
  );

  const remove = useCallback(
    (id: string) =>
      mutate((clusterViews) => {
        const index = clusterViews.findIndex((item) => item.id === id);
        if (index === -1) return { ok: false, error: "not-found" };

        const [view] = clusterViews.splice(index, 1);
        return { ok: true, view };
      }),
    [mutate]
  );

  const getById = useCallback(
    (id: string | undefined) => (id ? views.find((view) => view.id === id) : undefined),
    [views]
  );

  return useMemo(() => ({ views, create, update, remove, getById }), [views, create, update, remove, getById]);
}
