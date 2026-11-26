import { DEFECTDOJO_FINDING_STATES, type SecurityOverview, type StageRef } from "@my-project/shared";
import {
  AllSelect,
  CodebaseFilter,
  LevelField,
  RuntimeScopeFilters,
  SeverityField,
  StateFilter,
} from "@/modules/platform/security/components/defectdojo/FindingFilters";
import { environmentLabel, placeLabel } from "@/modules/platform/security/components/defectdojo/utils";
import type { Search } from "../../route";
import type { ViewFilters, levelsInView } from "../../utils/model";
import type { FilterPatch } from "../../utils/search";

/** Stage and CDPipeline names hold no "/": one value names an Environment. */
const ENVIRONMENT_SEPARATOR = "/";

type RuntimeScope = Extract<SecurityOverview, { state: "data" }>;

function environmentValue({ cdPipeline, stage }: StageRef): string {
  return `${cdPipeline}${ENVIRONMENT_SEPARATOR}${stage}`;
}

function environmentOptions(scope: RuntimeScope, clusters: readonly string[]) {
  return scope.namespaces
    .flatMap((option) =>
      option.environment && clusters.includes(option.cluster)
        ? [
            {
              value: environmentValue(option.environment),
              label: `${environmentLabel(option.environment)} (${placeLabel(option)})`,
            },
          ]
        : []
    )
    .sort((a, b) => a.label.localeCompare(b.label));
}

export interface OverviewFiltersProps {
  search: Search;
  filters: ViewFilters;
  levels: ReturnType<typeof levelsInView>;
  /** The scope of the Runtime part: its clusters, namespaces and Environments. `null` while it has none. */
  scope: RuntimeScope | null;
  /** The codebases of the Codebases part: with scans, and without. */
  codebases: string[];
  onChange: (patch: FilterPatch) => void;
}

/** The level hides the other levels; the clusters, namespace and Environment narrow Runtime, the codebase Code and Image. */
export function OverviewFilters({ search, filters, levels, scope, codebases, onChange }: OverviewFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <LevelField value={search.level} allLabel="All" onChange={(level) => onChange({ level })} />

      {levels.runtime && scope && (
        <>
          <RuntimeScopeFilters
            scope={scope}
            selectedClusters={[...filters.clusters]}
            workloadNamespace={filters.namespace}
            onChange={onChange}
          />
          <AllSelect
            label="Environment"
            allLabel="All Environments"
            value={filters.environment && environmentValue(filters.environment)}
            options={environmentOptions(scope, filters.clusters)}
            onChange={(value) => {
              const [cdPipeline, stage] = value?.split(ENVIRONMENT_SEPARATOR) ?? [];
              onChange({ cdPipeline, stage });
            }}
          />
        </>
      )}

      {levels.scanLevels.length > 0 && (
        <CodebaseFilter
          codebases={codebases}
          value={filters.codebase}
          onChange={(codebase) => onChange({ codebase })}
        />
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
