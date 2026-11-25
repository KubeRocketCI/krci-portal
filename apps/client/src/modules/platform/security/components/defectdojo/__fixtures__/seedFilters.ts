import type { QueryClient } from "@tanstack/react-query";
import { k8sCodebaseConfig, type FindingsScope } from "@my-project/shared";
import { getK8sWatchListQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";
import { TEST_CLUSTER_NAME } from "@/test/utils";
import { findingsScopeKey } from "../useFindingsScope";

function codebaseWatchList(namespace: string, codebases: string[]) {
  const items = new Map(
    codebases.map((name) => [
      name,
      {
        apiVersion: k8sCodebaseConfig.apiVersion,
        kind: k8sCodebaseConfig.kind,
        metadata: { name, namespace },
        spec: {},
      },
    ])
  );

  return { apiVersion: k8sCodebaseConfig.apiVersion, kind: `${k8sCodebaseConfig.kind}List`, metadata: {}, items };
}

export interface FilterData {
  namespace: string;
  scope: FindingsScope;
  codebases: string[];
}

export function seedFilterData(queryClient: QueryClient, { namespace, scope, codebases }: FilterData): void {
  queryClient.setQueryData(findingsScopeKey({ namespace }), scope);
  queryClient.setQueryData(
    getK8sWatchListQueryCacheKey(TEST_CLUSTER_NAME, namespace, k8sCodebaseConfig.group, k8sCodebaseConfig.pluralName),
    codebaseWatchList(namespace, codebases)
  );
}
