// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Overview variant C, "Worklist": the page is a short list of the most severe findings of the
// platform, with where each was found. Level, cluster and severity are filters; the full list is
// the Vulnerability Reports page. One line of Runtime totals stands in for the summary.
import React from "react";
import { Link } from "@tanstack/react-router";
import type { PrototypeDefectDojoSeverity } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { PATH_TRIVY_VULNERABILITIES_FULL } from "@/modules/platform/security/pages/trivy-vulnerabilities/route";
import { PrototypeStatePanel } from "../../components/PrototypeStatePanel";
import { SeverityCounts } from "../../components/SeverityCounts";
import { SeverityFilter } from "../../components/SeverityFilter";
import { CleanScanBadge, NoScanDataState, NotConfiguredState, UnreachableState } from "../../components/StateBlocks";
import { ClusterFilter } from "../components/ClusterFilter";
import { PlatformFindingsTable, type PlatformFindingsInput } from "../components/PlatformFindingsTable";
import { usePlatformModel } from "../hooks/usePlatformModel";
import { clusterTag, installationClusters, tenantTag } from "../model";
import type { SecurityPageProps } from "../types";

const WORKLIST_ROWS = 10;

/** Source of a list. API v2 cannot mix product tags and test tags in one request. */
type Source = "runtime" | "ci";

export function OverviewVariantC({ scope, pickedClusters, onClustersChange, note }: SecurityPageProps) {
  const [source, setSource] = React.useState<Source>("runtime");
  const [severity, setSeverity] = React.useState<PrototypeDefectDojoSeverity | undefined>(undefined);

  const model = usePlatformModel(scope, pickedClusters, {
    runtimeTotal: true,
    namespaceCounts: false,
    codebases: "none",
  });

  if (model.connection === "notConfigured") {
    return <NotConfiguredState />;
  }

  const input: PlatformFindingsInput | null =
    source === "ci"
      ? { testTagsAll: [tenantTag(scope)], severity, active: true }
      : model.selectedClusters.length > 0
        ? { productTagsAny: model.selectedClusters.map(clusterTag), severity, active: true }
        : null;

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
          <ClusterFilter
            clusters={model.clusters}
            selected={model.selectedClusters}
            installationClusters={installationClusters(scope)}
            onChange={onClustersChange}
          />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">Severity</span>
          <SeverityFilter value={severity} onChange={setSeverity} />
        </div>
      </div>

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
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm" data-testid="runtime-summary">
            <span className="font-medium">Runtime, {model.namespaces.length} namespaces:</span>
            {model.runtimeTotal?.total === 0 ? <CleanScanBadge /> : <SeverityCounts counts={model.runtimeTotal} />}
          </div>

          <Card className="space-y-3 p-4" data-testid="worklist">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-foreground text-sm font-semibold">
                Most severe findings: {source === "runtime" ? "running workloads" : "code and images of the codebases"}
              </h3>
              <Link
                to={PATH_TRIVY_VULNERABILITIES_FULL}
                params={{ clusterName: scope.portalClusterName }}
                search={{ variant: "A" }}
                className="text-secondary-dark hover:text-primary ml-auto text-xs underline-offset-4 hover:underline"
              >
                Open the full list
              </Link>
            </div>
            {input ? (
              <PlatformFindingsTable
                scope={scope}
                input={input}
                kind="vulnerabilities"
                pageSize={WORKLIST_ROWS}
                paged={false}
                caption="Most severe findings of the platform"
                empty={
                  severity ? (
                    "No findings match the filters."
                  ) : (
                    <>
                      <CleanScanBadge />
                      No active findings.
                    </>
                  )
                }
              />
            ) : (
              <p className="text-muted-foreground text-sm">Select a cluster.</p>
            )}
          </Card>
        </>
      )}

      <PrototypeStatePanel state={{ scope, source, severity, selectedClusters: model.selectedClusters }} />
    </div>
  );
}
