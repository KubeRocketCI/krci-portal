// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import type { PrototypeDefectDojoScopeCounts } from "@my-project/shared";
import {
  usePrototypeDefectDojoProductSetCounts,
  usePrototypeDefectDojoProducts,
  usePrototypeDefectDojoReset,
  usePrototypeDefectDojoSeverityCounts,
  usePrototypeDefectDojoTestLists,
} from "../../api/hooks";
import { buildCodebaseRows, buildNamespaceRows, installationClusters, tenantTag } from "../model";
import type { PlatformModel, PlatformScope, PlatformState } from "../types";

export interface PlatformModelOptions {
  /** One API v3 request for the Runtime findings of the selected clusters together. */
  runtimeTotal: boolean;
  /** One API v3 request per namespace product of the selected clusters. */
  namespaceCounts: boolean;
  /** `list`: the CI tests of the installation. `counts`: also one API v3 request per CI test. */
  codebases: "none" | "list" | "counts";
}

interface QueryLike {
  isLoading: boolean;
  isError: boolean;
  data: { state: string } | undefined;
}

function listState(query: QueryLike, hasRows: boolean): PlatformState {
  if (query.isLoading) return "loading";
  if (query.isError || query.data?.state === "unreachable") return "unreachable";
  return hasRows ? "data" : "noData";
}

/** Clusters shown: the picked ones, else the clusters of the installation's Stages, else every cluster. */
export function resolveSelectedClusters(
  scope: PlatformScope,
  clusters: string[],
  pickedClusters: string[] | null
): string[] {
  if (pickedClusters !== null) {
    return pickedClusters.filter((cluster) => clusters.includes(cluster));
  }
  const own = installationClusters(scope).filter((cluster) => clusters.includes(cluster));
  return own.length > 0 ? own : clusters;
}

/**
 * DefectDojo side of the Security pages.
 * Requests: one `listProducts` for every product of the Product Type, then what `options` asks for.
 */
export function usePlatformModel(
  scope: PlatformScope,
  pickedClusters: string[] | null,
  options: PlatformModelOptions
): PlatformModel & { selectedClusters: string[] } {
  const reset = usePrototypeDefectDojoReset();
  const productsQuery = usePrototypeDefectDojoProducts({ tags: [] });
  const products = productsQuery.data?.state === "data" ? productsQuery.data.data : [];

  const allNamespaces = buildNamespaceRows(scope, products);
  const clusters = [...new Set(allNamespaces.map((row) => row.cluster))].sort();
  const selectedClusters = resolveSelectedClusters(scope, clusters, pickedClusters);
  const namespaces = allNamespaces.filter((row) => selectedClusters.includes(row.cluster));
  const productIds = namespaces.map((row) => row.product.id).sort((left, right) => left - right);

  const runtimeTotalQuery = usePrototypeDefectDojoProductSetCounts(
    options.runtimeTotal && productIds.length > 0 ? { productIds } : null
  );
  const namespaceCountsQuery = usePrototypeDefectDojoSeverityCounts(
    options.namespaceCounts && productIds.length > 0 ? { productIds } : null
  );

  const [ciTestsQuery] = usePrototypeDefectDojoTestLists(
    React.useMemo(
      () => (options.codebases === "none" ? [] : [{ tags: [tenantTag(scope)] }]),
      [options.codebases, scope]
    )
  );
  const codebases = ciTestsQuery?.data?.state === "data" ? buildCodebaseRows(scope, ciTestsQuery.data.data) : [];
  const ciTestIds = codebases
    .flatMap((codebase) => codebase.tests.map((test) => test.id))
    .sort((left, right) => left - right);
  const ciCountsQuery = usePrototypeDefectDojoSeverityCounts(
    options.codebases === "counts" && ciTestIds.length > 0 ? { testIds: ciTestIds } : null
  );

  const testCounts = React.useMemo(() => {
    const byTest = new Map<number, PrototypeDefectDojoScopeCounts>();
    if (ciCountsQuery.data?.state === "data") {
      for (const item of ciCountsQuery.data.data) {
        byTest.set(item.id, item);
      }
    }
    return byTest;
  }, [ciCountsQuery.data]);

  if (namespaceCountsQuery.data?.state === "data") {
    const byProduct = new Map(namespaceCountsQuery.data.data.map((item) => [item.id, item.active]));
    for (const row of namespaces) {
      row.counts = byProduct.get(row.product.id) ?? null;
    }
  }

  const queries: (QueryLike | undefined)[] = [
    productsQuery,
    runtimeTotalQuery,
    namespaceCountsQuery,
    ciCountsQuery,
    ciTestsQuery,
  ];

  let connection: PlatformModel["connection"] = "ready";
  if (queries.some((query) => query?.data?.state === "notConfigured")) {
    connection = "notConfigured";
  } else if (productsQuery.isLoading) {
    connection = "loading";
  }

  const dependentUnreachable = [runtimeTotalQuery, namespaceCountsQuery].some(
    (query) => query.isError || query.data?.state === "unreachable"
  );

  return {
    connection,
    state: dependentUnreachable ? "unreachable" : listState(productsQuery, products.length > 0),
    clusters,
    selectedClusters,
    namespaces,
    runtimeTotal: runtimeTotalQuery.data?.state === "data" ? runtimeTotalQuery.data.data.active : null,
    codebasesState: ciTestsQuery ? listState(ciTestsQuery, codebases.length > 0) : "notRequested",
    codebases,
    testCounts,
    retry: () => void reset(),
  };
}
