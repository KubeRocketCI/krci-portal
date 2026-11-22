// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Vulnerability Reports on DefectDojo: one server-paged list of findings over all namespaces or all
// codebases. Level, cluster, namespace or codebase, severity, state, vulnerability id and component
// are filters. The secret findings have their own page.
import React from "react";
import type { PrototypeDefectDojoSeverity } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { PrototypeStatePanel } from "../../components/PrototypeStatePanel";
import { SeverityFilter } from "../../components/SeverityFilter";
import { CleanScanBadge, NoScanDataState, NotConfiguredState, UnreachableState } from "../../components/StateBlocks";
import { ClusterFilter } from "../components/ClusterFilter";
import { PlatformFindingsTable, type PlatformFindingsInput } from "../components/PlatformFindingsTable";
import { usePlatformModel } from "../hooks/usePlatformModel";
import { clusterTag, codebaseTag, installationClusters, namespaceTag, tenantTag } from "../model";
import type { SecurityPageProps } from "../types";

/** Source of the list. API v2 cannot mix product tags and test tags in one request. */
type Source = "runtime" | "ci";
type StateView = "active" | "triaged" | "all";

const ALL = "__all__";

function activeFilter(view: StateView): boolean | undefined {
  if (view === "active") return true;
  if (view === "triaged") return false;
  return undefined;
}

export function VulnerabilitiesList({
  scope,
  pickedClusters,
  onClustersChange,
  initialNamespace,
  note,
}: SecurityPageProps) {
  const [source, setSource] = React.useState<Source>("runtime");
  const [namespaceKey, setNamespaceKey] = React.useState(() =>
    initialNamespace && pickedClusters?.length === 1 ? `${pickedClusters[0]}|${initialNamespace}` : ALL
  );
  const [codebase, setCodebase] = React.useState(ALL);
  const [severity, setSeverity] = React.useState<PrototypeDefectDojoSeverity | undefined>(undefined);
  const [view, setView] = React.useState<StateView>("active");
  const [text, setText] = React.useState({ vulnerabilityId: "", componentName: "" });

  const model = usePlatformModel(scope, pickedClusters, {
    runtimeTotal: false,
    namespaceCounts: false,
    codebases: source === "ci" ? "list" : "none",
  });

  if (model.connection === "notConfigured") {
    return <NotConfiguredState />;
  }

  const namespaceRow = model.namespaces.find((row) => `${row.cluster}|${row.namespace}` === namespaceKey) ?? null;
  const pickedCodebase = model.codebases.find((row) => row.codebaseName === codebase) ?? null;

  const filters = {
    severity,
    active: activeFilter(view),
    vulnerabilityId: text.vulnerabilityId || undefined,
    componentName: text.componentName || undefined,
  };

  let input: PlatformFindingsInput | null = null;
  if (source === "ci") {
    input = {
      testTagsAll: pickedCodebase ? [tenantTag(scope), codebaseTag(pickedCodebase.codebaseName)] : [tenantTag(scope)],
      ...filters,
    };
  } else if (namespaceRow) {
    input = { productTagsAll: [clusterTag(namespaceRow.cluster), namespaceTag(namespaceRow.namespace)], ...filters };
  } else if (model.selectedClusters.length > 0) {
    input = { productTagsAny: model.selectedClusters.map(clusterTag), ...filters };
  }

  const handleTextSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setText({
      vulnerabilityId: String(data.get("vulnerabilityId") ?? "").trim(),
      componentName: String(data.get("componentName") ?? "").trim(),
    });
  };

  const hasFilters = Boolean(severity || text.vulnerabilityId || text.componentName || view !== "active");

  return (
    <div className="space-y-4">
      {note && <Alert>{note}</Alert>}

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Level</span>
          <ToggleButtonGroup
            value={source}
            aria-label="Level"
            onChange={(_event, next) => next !== null && setSource(next)}
          >
            <ToggleButton value="runtime">Runtime</ToggleButton>
            <ToggleButton value="ci">Code and Image</ToggleButton>
          </ToggleButtonGroup>
        </div>

        {source === "runtime" && (
          <>
            <ClusterFilter
              clusters={model.clusters}
              selected={model.selectedClusters}
              installationClusters={installationClusters(scope)}
              onChange={onClustersChange}
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="prototype-vulnerabilities-namespace">Namespace</Label>
              <Select value={namespaceRow ? namespaceKey : ALL} onValueChange={setNamespaceKey}>
                <SelectTrigger id="prototype-vulnerabilities-namespace" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All namespaces</SelectItem>
                  {model.namespaces.map((row) => (
                    <SelectItem key={row.product.id} value={`${row.cluster}|${row.namespace}`}>
                      {row.cluster} / {row.namespace}
                      {row.stage && ` (${row.stage.cdPipeline} / ${row.stage.stage})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {source === "ci" && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="prototype-vulnerabilities-codebase">Codebase</Label>
            <Select value={pickedCodebase ? codebase : ALL} onValueChange={setCodebase}>
              <SelectTrigger id="prototype-vulnerabilities-codebase" className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All codebases</SelectItem>
                {model.codebases.map((row) => (
                  <SelectItem key={row.codebaseName} value={row.codebaseName}>
                    {row.codebaseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Severity</span>
          <SeverityFilter value={severity} onChange={setSeverity} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">State</span>
          <ToggleButtonGroup
            value={view}
            aria-label="Finding state"
            onChange={(_event, next) => next !== null && setView(next)}
          >
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="triaged">Triaged</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3" onSubmit={handleTextSubmit}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="prototype-vulnerabilities-cve">Vulnerability id (exact)</Label>
          <Input
            id="prototype-vulnerabilities-cve"
            name="vulnerabilityId"
            placeholder="CVE-2026-116587"
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="prototype-vulnerabilities-component">Component (exact)</Label>
          <Input
            id="prototype-vulnerabilities-component"
            name="componentName"
            placeholder="libcrypto3"
            className="w-56"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>

      {model.state === "loading" && (
        <div className="flex justify-center p-12">
          <LoadingSpinner />
        </div>
      )}
      {model.state === "unreachable" && <UnreachableState onRetry={model.retry} />}
      {model.state === "noData" && (
        <NoScanDataState
          level="runtime"
          subject="this installation"
          hint="DefectDojo holds no product of the configured Product Type."
        />
      )}

      {model.state === "data" && (
        <Card className="p-4" data-testid="vulnerabilities-list">
          {source === "ci" && model.codebasesState === "noData" && (
            <NoScanDataState level="image" subject="this installation" />
          )}
          {input && !(source === "ci" && model.codebasesState === "noData") && (
            <PlatformFindingsTable
              scope={scope}
              input={input}
              kind="vulnerabilities"
              caption="Vulnerability findings"
              empty={
                hasFilters ? (
                  "No findings match the filters."
                ) : (
                  <>
                    <CleanScanBadge />
                    No active findings.
                  </>
                )
              }
            />
          )}
          {!input && <p className="text-muted-foreground text-sm">Select a cluster.</p>}
        </Card>
      )}

      <PrototypeStatePanel state={{ scope, source, namespaceKey, codebase, severity, view, text, input }} />
    </div>
  );
}
