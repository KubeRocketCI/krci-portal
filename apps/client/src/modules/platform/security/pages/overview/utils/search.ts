import type { Search } from "../route";
import type { ViewFilters } from "./model";

export type FilterPatch = Partial<Omit<Search, "tab">>;

/** A change of clusters clears the namespace and the Environment: their options depend on the clusters. */
export function withFilters(search: Search, patch: FilterPatch): Search {
  const next: Search = { ...search, ...patch };
  if ("cluster" in patch) {
    next.namespace = undefined;
    next.cdPipeline = undefined;
    next.stage = undefined;
  }
  return next;
}

export function toViewFilters(search: Search, defaultClusters: readonly string[]): ViewFilters {
  return {
    clusters: search.cluster ?? defaultClusters,
    namespace: search.namespace,
    environment:
      search.cdPipeline !== undefined && search.stage !== undefined
        ? { cdPipeline: search.cdPipeline, stage: search.stage }
        : undefined,
    codebase: search.codebase,
    level: search.level,
    severity: search.severity,
  };
}
