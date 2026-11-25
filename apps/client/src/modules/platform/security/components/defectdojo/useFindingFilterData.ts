import { sortByName } from "@/core/utils/sortByName";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useFindingsScope } from "./useFindingsScope";

export interface FindingFilterDataOptions {
  /** The installation namespace. */
  namespace: string;
  /** Picked by the user; left out: the default clusters of the scope. */
  clusters: string[] | undefined;
  readCodebases?: boolean;
}

export type FindingFilterData = ReturnType<typeof useFindingFilterData>;

/** What the filters of a platform list show: the scope, the pressed clusters and the Codebases to pick from. */
export function useFindingFilterData({ namespace, clusters, readCodebases = true }: FindingFilterDataOptions) {
  const scope = useFindingsScope({ namespace });
  const codebasesWatch = useCodebaseWatchList({ namespace, queryOptions: { enabled: readCodebases } });
  const scopeData = scope.data?.state === "data" ? scope.data : null;

  return {
    scope: scopeData,
    selectedClusters: clusters ?? scopeData?.defaultClusters ?? [],
    codebases: codebasesWatch.data.array.map((codebase) => codebase.metadata.name).sort(sortByName),
  };
}
