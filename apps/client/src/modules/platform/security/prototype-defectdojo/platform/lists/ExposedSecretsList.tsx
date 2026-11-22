// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Exposed Secrets on DefectDojo: two lists on one page. "Code" holds the findings of the secret
// scanner of the CI security pipeline; "Runtime" holds the ExposedSecretReport findings of running
// workloads. A row shows rule, file and line and where it was found, never the secret value.
import React from "react";
import { PROTOTYPE_DEFECTDOJO_CODE_SECRETS_SCAN_TYPE } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { usePrototypeDefectDojoTestLists } from "../../api/hooks";
import { PrototypeStatePanel } from "../../components/PrototypeStatePanel";
import { CleanScanBadge, NoScanDataState, NotConfiguredState, UnreachableState } from "../../components/StateBlocks";
import { PROTOTYPE_LEVEL_META } from "../../constants";
import { isTestNotRunning } from "../../utils";
import { ClusterFilter } from "../components/ClusterFilter";
import { PlatformFindingsTable } from "../components/PlatformFindingsTable";
import { usePlatformModel } from "../hooks/usePlatformModel";
import { clusterTag, installationClusters, tenantTag } from "../model";
import type { SecurityPageProps } from "../types";

type StateView = "active" | "triaged";

export function ExposedSecretsList({ scope, pickedClusters, onClustersChange, note }: SecurityPageProps) {
  const [view, setView] = React.useState<StateView>("active");

  const model = usePlatformModel(scope, pickedClusters, {
    runtimeTotal: false,
    namespaceCounts: false,
    codebases: "list",
  });

  // The Runtime tests of the selected clusters say how many containers were scanned for secrets.
  const clusterKey = model.selectedClusters.join("|");
  const clusterTestQueries = usePrototypeDefectDojoTestLists(
    React.useMemo(
      () => (clusterKey === "" ? [] : clusterKey.split("|").map((cluster) => ({ tags: [clusterTag(cluster)] }))),
      [clusterKey]
    )
  );

  if (model.connection === "notConfigured") {
    return <NotConfiguredState />;
  }

  const codeScans = model.codebases.flatMap((codebase) =>
    codebase.tests.filter((test) => test.scanType === PROTOTYPE_DEFECTDOJO_CODE_SECRETS_SCAN_TYPE)
  );
  const runtimeScans = clusterTestQueries.flatMap((query) =>
    query.data?.state === "data"
      ? query.data.data.filter((test) => test.reportKind === "ExposedSecretReport" && !isTestNotRunning(test))
      : []
  );
  const runtimeLoading = clusterTestQueries.some((query) => query.isLoading);
  const runtimeUnreachable = clusterTestQueries.some((query) => query.isError || query.data?.state === "unreachable");
  const active = view === "active";

  return (
    <div className="space-y-4">
      {note && <Alert>{note}</Alert>}

      <div className="flex flex-wrap items-end gap-4">
        <ClusterFilter
          clusters={model.clusters}
          selected={model.selectedClusters}
          installationClusters={installationClusters(scope)}
          onChange={onClustersChange}
        />
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">State</span>
          <ToggleButtonGroup
            value={view}
            aria-label="Finding state"
            onChange={(_event, next) => next !== null && setView(next)}
          >
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="triaged">Triaged</ToggleButton>
          </ToggleButtonGroup>
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
          <Card className="space-y-3 p-4" data-testid="secrets-code">
            <SectionHeading
              level="code"
              title="Secrets in source code"
              detail={`${PROTOTYPE_DEFECTDOJO_CODE_SECRETS_SCAN_TYPE}, ${codeScans.length} scans of ${model.codebases.length} codebases`}
            />
            {model.codebasesState === "loading" && <LoadingSpinner size={24} />}
            {model.codebasesState === "unreachable" && (
              <UnreachableState compact what="Code findings" onRetry={model.retry} />
            )}
            {model.codebasesState !== "loading" && model.codebasesState !== "unreachable" && codeScans.length === 0 && (
              <NoScanDataState level="code" subject="this installation" />
            )}
            {codeScans.length > 0 && (
              <PlatformFindingsTable
                scope={scope}
                input={{
                  testTagsAll: [tenantTag(scope)],
                  scanType: PROTOTYPE_DEFECTDOJO_CODE_SECRETS_SCAN_TYPE,
                  active,
                }}
                kind="secrets"
                caption="Secrets in source code"
                empty={<CleanSecrets active={active} scans={codeScans.length} what="scans" />}
              />
            )}
          </Card>

          <Card className="space-y-3 p-4" data-testid="secrets-runtime">
            <SectionHeading
              level="runtime"
              title="Secrets in running images"
              detail={`ExposedSecretReport, ${runtimeScans.length} running containers scanned`}
            />
            {runtimeLoading && <LoadingSpinner size={24} />}
            {runtimeUnreachable && <UnreachableState compact what="Runtime findings" onRetry={model.retry} />}
            {!runtimeLoading && !runtimeUnreachable && model.selectedClusters.length === 0 && (
              <p className="text-muted-foreground text-sm">Select a cluster.</p>
            )}
            {!runtimeLoading &&
              !runtimeUnreachable &&
              model.selectedClusters.length > 0 &&
              runtimeScans.length === 0 && <NoScanDataState level="runtime" subject="the selected clusters" />}
            {runtimeScans.length > 0 && (
              <PlatformFindingsTable
                scope={scope}
                input={{
                  productTagsAny: model.selectedClusters.map(clusterTag),
                  runtimeSecretsOnly: true,
                  active,
                }}
                kind="secrets"
                caption="Secrets in running images"
                empty={<CleanSecrets active={active} scans={runtimeScans.length} what="running containers" />}
              />
            )}
          </Card>
        </>
      )}

      <PrototypeStatePanel
        state={{
          scope,
          view,
          selectedClusters: model.selectedClusters,
          codeScans: codeScans.length,
          runtimeScans: runtimeScans.length,
        }}
      />
    </div>
  );
}

function SectionHeading({ level, title, detail }: { level: "code" | "runtime"; title: string; detail: string }) {
  const Icon = PROTOTYPE_LEVEL_META[level].icon;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Icon className="size-4" aria-hidden />
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <span className="text-muted-foreground text-xs">{detail}</span>
    </div>
  );
}

function CleanSecrets({ active, scans, what }: { active: boolean; scans: number; what: string }) {
  if (!active) {
    return <>No triaged secret findings.</>;
  }
  return (
    <>
      <CleanScanBadge />
      No exposed secrets in {scans} {what}.
    </>
  );
}
