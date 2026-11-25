import { isRuntimeFindingState, type VulnerabilitiesRequest } from "@my-project/shared";
import { toPageRequest } from "@/modules/platform/security/components/defectdojo/searchParams";
import type { Search } from "../route";

export type FilterPatch = Partial<Omit<Search, "page" | "rowsPerPage">>;

/** Runtime has no Mitigated state: a state it lacks is cleared, which reads as Active. */
export function withFilters(search: Search, patch: FilterPatch): Search {
  const next: Search = { ...search, ...patch, page: undefined };
  if ((next.level ?? "runtime") === "runtime" && next.state !== undefined && !isRuntimeFindingState(next.state)) {
    next.state = undefined;
  }
  return next;
}

export function searchToInput(search: Search, namespace: string): VulnerabilitiesRequest {
  const common = {
    namespace,
    severity: search.severity,
    vulnerabilityId: search.vulnerabilityId,
    component: search.component,
    ...toPageRequest(search.page, search.rowsPerPage),
  };

  const level = search.level ?? "runtime";
  if (level === "runtime") {
    return {
      level,
      clusters: search.cluster,
      workloadNamespace: search.namespace,
      state: search.state && isRuntimeFindingState(search.state) ? search.state : "active",
      ...common,
    };
  }
  return { level, codebase: search.codebase, state: search.state ?? "active", ...common };
}
