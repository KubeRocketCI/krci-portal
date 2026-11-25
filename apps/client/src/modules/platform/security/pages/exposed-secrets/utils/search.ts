import { isRuntimeFindingState, type ExposedSecretsRequest } from "@my-project/shared";
import { toPageRequest } from "@/modules/platform/security/components/defectdojo/searchParams";
import type { Search } from "../route";

const FIRST_PAGES = { codePage: undefined, runtimePage: undefined };

export type FilterPatch = Partial<Omit<Search, "codePage" | "runtimePage" | "rowsPerPage">>;

export function withFilters(search: Search, patch: FilterPatch): Search {
  return { ...search, ...patch, ...FIRST_PAGES };
}

export function withRowsPerPage(search: Search, rowsPerPage: number): Search {
  return { ...search, rowsPerPage, ...FIRST_PAGES };
}

/** `page`: the 0-based page of the table. */
export function withPage(search: Search, list: ExposedSecretsRequest["level"], page: number): Search {
  return list === "code" ? { ...search, codePage: page + 1 } : { ...search, runtimePage: page + 1 };
}

type CodeRequest = Extract<ExposedSecretsRequest, { level: "code" }>;
type RuntimeRequest = Extract<ExposedSecretsRequest, { level: "runtime" }>;

/** The requests of both lists. Runtime has no Mitigated state, so under Mitigated it sends none (`null`). */
export function searchToInputs(
  search: Search,
  namespace: string
): { code: CodeRequest; runtime: RuntimeRequest | null } {
  const state = search.state ?? "active";
  const common = { namespace, severity: search.severity };

  return {
    code: {
      level: "code",
      codebase: search.codebase,
      state,
      ...common,
      ...toPageRequest(search.codePage, search.rowsPerPage),
    },
    runtime: isRuntimeFindingState(state)
      ? {
          level: "runtime",
          clusters: search.cluster,
          workloadNamespace: search.namespace,
          state,
          ...common,
          ...toPageRequest(search.runtimePage, search.rowsPerPage),
        }
      : null,
  };
}
