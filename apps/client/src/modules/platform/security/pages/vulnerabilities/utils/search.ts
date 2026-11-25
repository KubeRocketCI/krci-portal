import {
  RUNTIME_FINDING_STATES,
  SCAN_FINDINGS_MAX_PAGE,
  VULNERABILITIES_DEFAULT_PAGE_SIZE,
  type DefectDojoFindingState,
  type VulnerabilitiesRequest,
} from "@my-project/shared";
import type { Search } from "../route";

/** Search params that are filters: a change of one starts the list again at its first page. */
export type FilterPatch = Partial<Omit<Search, "page" | "rowsPerPage">>;

function isRuntimeState(state: DefectDojoFindingState): state is (typeof RUNTIME_FINDING_STATES)[number] {
  return (RUNTIME_FINDING_STATES as readonly DefectDojoFindingState[]).includes(state);
}

/** Runtime has no Mitigated state: a state it lacks is cleared, which reads as Active. */
export function withFilters(search: Search, patch: FilterPatch): Search {
  const next: Search = { ...search, ...patch, page: undefined };
  if ((next.level ?? "runtime") === "runtime" && next.state !== undefined && !isRuntimeState(next.state)) {
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
    page: Math.min((search.page ?? 1) - 1, SCAN_FINDINGS_MAX_PAGE),
    pageSize: search.rowsPerPage ?? VULNERABILITIES_DEFAULT_PAGE_SIZE,
  };

  const level = search.level ?? "runtime";
  if (level === "runtime") {
    return {
      level,
      clusters: search.cluster,
      workloadNamespace: search.namespace,
      state: search.state && isRuntimeState(search.state) ? search.state : "active",
      ...common,
    };
  }
  return { level, codebase: search.codebase, state: search.state ?? "active", ...common };
}
