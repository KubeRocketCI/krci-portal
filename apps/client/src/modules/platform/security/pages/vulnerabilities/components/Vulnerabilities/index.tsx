import { Card } from "@/core/components/ui/card";
import { PlatformFindingsList } from "@/modules/platform/security/components/defectdojo/PlatformFindingsList";
import { useFindingFilterData } from "@/modules/platform/security/components/defectdojo/useFindingFilterData";
import { useVulnerabilities } from "../../hooks/useVulnerabilities";
import type { Search } from "../../route";
import { searchToInput, withFilters, type FilterPatch } from "../../utils/search";
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
  const filterData = useFindingFilterData({
    namespace,
    clusters: search.cluster,
    readCodebases: input.level !== "runtime",
  });

  const handleFilterChange = (patch: FilterPatch) => onSearchChange(withFilters(search, patch));

  return (
    <div className="space-y-4">
      <VulnerabilityFilters input={input} {...filterData} onChange={handleFilterChange} />
      <Card className="p-4">
        <PlatformFindingsList
          query={list}
          input={input}
          columns={input.level === "code" ? "code" : "image"}
          caption="Vulnerability findings"
          name="Vulnerabilities"
          what="vulnerability findings"
          onPageChange={(page) => onSearchChange({ ...search, page: page + 1 })}
          onRowsPerPageChange={(rowsPerPage) => onSearchChange({ ...search, rowsPerPage, page: undefined })}
          clusterName={clusterName}
        />
      </Card>
    </div>
  );
}
