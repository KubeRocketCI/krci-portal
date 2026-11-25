import { Card } from "@/core/components/ui/card";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useFindingsScope } from "../../hooks/useFindingsScope";
import { useVulnerabilities } from "../../hooks/useVulnerabilities";
import type { Search } from "../../route";
import { searchToInput, withFilters, type FilterPatch } from "../../utils/search";
import { VulnerabilitiesList } from "../VulnerabilitiesList";
import { VulnerabilityFilters } from "../VulnerabilityFilters";

export interface VulnerabilitiesProps {
  search: Search;
  onSearchChange: (search: Search) => void;
  /** The installation namespace: its Stages, Applications and Codebases. */
  namespace: string;
  /** The portal cluster the row links open in. */
  clusterName: string;
}

export function Vulnerabilities({ search, onSearchChange, namespace, clusterName }: VulnerabilitiesProps) {
  const input = searchToInput(search, namespace);
  const list = useVulnerabilities(input);
  const scope = useFindingsScope({ namespace });
  const codebasesWatch = useCodebaseWatchList({
    namespace,
    queryOptions: { enabled: input.level !== "runtime" },
  });

  const handleFilterChange = (patch: FilterPatch) => onSearchChange(withFilters(search, patch));

  const scopeData = scope.data?.state === "data" ? scope.data : null;
  const listClusters = list.data?.state === "data" ? list.data.clusters : null;
  // Before the list answers, and for a list of every cluster (`null`), the default of `runtimeClusters` on the server:
  // the Stage clusters, or every cluster without a Stage.
  const selectedClusters =
    search.cluster ??
    listClusters ??
    (scopeData?.stageClusters.length ? scopeData.stageClusters : scopeData?.clusters) ??
    [];

  return (
    <div className="space-y-4">
      <VulnerabilityFilters
        input={input}
        scope={scopeData}
        selectedClusters={selectedClusters}
        codebases={codebasesWatch.data.array.map((codebase) => codebase.metadata.name).sort()}
        onChange={handleFilterChange}
      />
      <Card className="p-4">
        <VulnerabilitiesList
          query={list}
          input={input}
          onPageChange={(page) => onSearchChange({ ...search, page: page + 1 })}
          onRowsPerPageChange={(rowsPerPage) => onSearchChange({ ...search, rowsPerPage, page: undefined })}
          clusterName={clusterName}
        />
      </Card>
    </div>
  );
}
