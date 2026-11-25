import * as React from "react";
import type { DefectDojoFindingState, DefectDojoSeverity, FindingsScope } from "@my-project/shared";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { cn } from "@/core/utils/classname";
import { ClusterFilter } from "../ClusterFilter";
import { FINDING_STATE_LABELS } from "../constants";
import { SeverityFilter } from "../SeverityFilter";
import { environmentLabel } from "../utils";

const ALL = "__all__";

type FindingsScopeData = Extract<FindingsScope, { state: "data" }>;

export function FilterField({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {label}
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-muted-foreground text-xs font-medium", className)}>{children}</span>;
}

interface AllSelectProps {
  label: string;
  allLabel: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}

function AllSelect({ label, allLabel, value, options, onChange }: AllSelectProps) {
  const id = React.useId();

  return (
    <FilterField label={<Label htmlFor={id}>{label}</Label>}>
      <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? undefined : next)}>
        <SelectTrigger id={id} className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}

function namespaceOptions(scope: FindingsScopeData, clusters: readonly string[]) {
  const environmentsByNamespace = new Map<string, string[]>();
  for (const { cluster, namespace, environment } of scope.namespaces) {
    if (clusters.includes(cluster)) {
      const environments = environmentsByNamespace.get(namespace) ?? [];
      if (environment) {
        environments.push(environmentLabel(environment));
      }
      environmentsByNamespace.set(namespace, environments);
    }
  }
  return [...environmentsByNamespace.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([namespace, environments]) => ({
      value: namespace,
      label: environments.length > 0 ? `${namespace} (${environments.join(", ")})` : namespace,
    }));
}

export interface RuntimeScopeFiltersProps {
  scope: FindingsScopeData;
  selectedClusters: string[];
  workloadNamespace: string | undefined;
  onChange: (patch: { cluster?: string[]; namespace?: string }) => void;
}

/** A change of clusters clears the namespace: its options depend on the selected clusters. */
export function RuntimeScopeFilters({
  scope,
  selectedClusters,
  workloadNamespace,
  onChange,
}: RuntimeScopeFiltersProps) {
  return (
    <>
      <ClusterFilter
        clusters={scope.clusters}
        selected={selectedClusters}
        stageClusters={scope.stageClusters}
        onChange={(clusters) => onChange({ cluster: clusters, namespace: undefined })}
      />
      <AllSelect
        label="Namespace"
        allLabel="All namespaces"
        value={workloadNamespace}
        options={namespaceOptions(scope, selectedClusters)}
        onChange={(namespace) => onChange({ namespace })}
      />
    </>
  );
}

export interface CodebaseFilterProps {
  codebases: string[];
  value: string | undefined;
  onChange: (codebase: string | undefined) => void;
}

export function CodebaseFilter({ codebases, value, onChange }: CodebaseFilterProps) {
  return (
    <AllSelect
      label="Codebase"
      allLabel="All codebases"
      value={value}
      options={codebases.map((codebase) => ({ value: codebase, label: codebase }))}
      onChange={onChange}
    />
  );
}

export function SeverityField({
  value,
  onChange,
}: {
  value: DefectDojoSeverity | undefined;
  onChange: (severity: DefectDojoSeverity | undefined) => void;
}) {
  return (
    <FilterField label={<SectionLabel>Severity</SectionLabel>}>
      <SeverityFilter value={value} onChange={onChange} />
    </FilterField>
  );
}

export interface StateFilterProps {
  states: readonly DefectDojoFindingState[];
  value: DefectDojoFindingState;
  /** `undefined`: Active, the default. */
  onChange: (state: DefectDojoFindingState | undefined) => void;
}

export function StateFilter({ states, value, onChange }: StateFilterProps) {
  return (
    <FilterField label={<SectionLabel>State</SectionLabel>}>
      <ToggleButtonGroup<DefectDojoFindingState>
        value={value}
        aria-label="Finding state"
        onChange={(_event, next) => next !== null && onChange(next === "active" ? undefined : next)}
      >
        {states.map((state) => (
          <ToggleButton key={state} value={state}>
            {FINDING_STATE_LABELS[state]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FilterField>
  );
}
