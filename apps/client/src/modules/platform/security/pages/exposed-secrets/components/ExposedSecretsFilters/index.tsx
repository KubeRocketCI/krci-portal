import type { ReactNode } from "react";
import { DEFECTDOJO_FINDING_STATES } from "@my-project/shared";
import {
  CodebaseFilter,
  RuntimeScopeFilters,
  SectionLabel,
  SeverityField,
  StateFilter,
} from "@/modules/platform/security/components/defectdojo/FindingFilters";
import type { FindingFilterData } from "@/modules/platform/security/components/defectdojo/useFindingFilterData";
import type { Search } from "../../route";
import type { FilterPatch } from "../../utils/search";

export interface ExposedSecretsFiltersProps extends FindingFilterData {
  search: Search;
  onChange: (patch: FilterPatch) => void;
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-end gap-4 rounded-md border px-3 pt-2 pb-3">
      <SectionLabel className="w-full">{label}</SectionLabel>
      {children}
    </div>
  );
}

export function ExposedSecretsFilters({
  search,
  scope,
  selectedClusters,
  codebases,
  onChange,
}: ExposedSecretsFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <FilterGroup label="Source code">
        <CodebaseFilter codebases={codebases} value={search.codebase} onChange={(codebase) => onChange({ codebase })} />
      </FilterGroup>
      {scope && (
        <FilterGroup label="Running workloads">
          <RuntimeScopeFilters
            scope={scope}
            selectedClusters={selectedClusters}
            workloadNamespace={search.namespace}
            onChange={onChange}
          />
        </FilterGroup>
      )}
      <SeverityField value={search.severity} onChange={(severity) => onChange({ severity })} />
      <StateFilter
        states={DEFECTDOJO_FINDING_STATES}
        value={search.state ?? "active"}
        onChange={(state) => onChange({ state })}
      />
    </div>
  );
}
