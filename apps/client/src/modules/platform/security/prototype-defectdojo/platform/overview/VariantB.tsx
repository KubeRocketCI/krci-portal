// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Overview variant B, "Inventory": two tabs. "Namespaces" lists every namespace of the selected
// clusters, per cluster, Environments and managed namespaces before the other ones. "Codebases"
// lists every Code and Image scan per codebase and names the codebases that have none.
import React from "react";
import { PROTOTYPE_DEFECTDOJO_TAG_KEY, type PrototypeDefectDojoSeverityCounts } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { cn } from "@/core/utils/classname";
import { DefectDojoLink } from "../../components/DefectDojoLink";
import { PrototypeStatePanel } from "../../components/PrototypeStatePanel";
import { SeverityCountChip } from "../../components/SeverityCounts";
import { CleanScanBadge, NoScanDataState, NotConfiguredState, UnreachableState } from "../../components/StateBlocks";
import { PROTOTYPE_LEVEL_META, PROTOTYPE_NO_VALUE, PROTOTYPE_SEVERITY_KEYS } from "../../constants";
import { formatScanTime, getTagValue } from "../../utils";
import { ClusterFilter } from "../components/ClusterFilter";
import { CodebaseFindingsLink, EnvironmentFindingsLink } from "../components/PlaceLinks";
import { usePlatformModel } from "../hooks/usePlatformModel";
import { compareBySeverityCounts, installationClusters } from "../model";
import type { NamespaceRow, PlatformModel, PlatformScope, SecurityPageProps } from "../types";

type InventoryTab = "namespaces" | "codebases";

const HEAD_CLASS = "bg-muted text-muted-foreground px-3 py-2 text-xs font-medium";
const CELL_CLASS = "px-3 py-2 align-middle";

function CountCells({ counts }: { counts: PrototypeDefectDojoSeverityCounts | null }) {
  return (
    <>
      {PROTOTYPE_SEVERITY_KEYS.map(({ severity, key }) => (
        <TableCellUI key={severity} className={cn(CELL_CLASS, "text-center")}>
          <SeverityCountChip severity={severity} count={counts ? counts[key] : null} />
        </TableCellUI>
      ))}
    </>
  );
}

function CountHeads() {
  return (
    <>
      {PROTOTYPE_SEVERITY_KEYS.map(({ severity }) => (
        <TableHeadUI key={severity} scope="col" className={cn(HEAD_CLASS, "w-16 text-center")}>
          {severity}
        </TableHeadUI>
      ))}
    </>
  );
}

export function OverviewVariantB({ scope, pickedClusters, onClustersChange, note }: SecurityPageProps) {
  const [tab, setTab] = React.useState<InventoryTab>("namespaces");
  // The Code and Image scans are read when their tab opens.
  const model = usePlatformModel(scope, pickedClusters, {
    runtimeTotal: false,
    namespaceCounts: true,
    codebases: tab === "codebases" ? "counts" : "none",
  });

  if (model.connection === "notConfigured") {
    return <NotConfiguredState />;
  }

  return (
    <div className="space-y-4">
      {note && <Alert>{note}</Alert>}

      <Tabs value={tab} onValueChange={(value) => setTab(value === "codebases" ? "codebases" : "namespaces")}>
        <TabsList>
          <TabsTrigger value="namespaces">Namespaces (Runtime)</TabsTrigger>
          <TabsTrigger value="codebases">Codebases (Code, Image)</TabsTrigger>
        </TabsList>

        <TabsContent value="namespaces" className="space-y-4">
          <ClusterFilter
            clusters={model.clusters}
            selected={model.selectedClusters}
            installationClusters={installationClusters(scope)}
            onChange={onClustersChange}
          />
          {model.state === "loading" && (
            <div className="flex justify-center p-12">
              <LoadingSpinner />
            </div>
          )}
          {model.state === "unreachable" && <UnreachableState what="Runtime findings" onRetry={model.retry} />}
          {model.state === "noData" && (
            <NoScanDataState
              level="runtime"
              subject="this installation"
              hint="DefectDojo holds no product of the configured Product Type."
            />
          )}
          {model.state === "data" &&
            model.selectedClusters.map((cluster) => (
              <ClusterSection
                key={cluster}
                scope={scope}
                cluster={cluster}
                rows={model.namespaces.filter((row) => row.cluster === cluster)}
              />
            ))}
          {model.state === "data" && model.selectedClusters.length === 0 && (
            <p className="text-muted-foreground text-sm">Select a cluster.</p>
          )}
        </TabsContent>

        <TabsContent value="codebases">
          <CodebaseInventory scope={scope} model={model} />
        </TabsContent>
      </Tabs>

      <PrototypeStatePanel state={{ scope, tab, selectedClusters: model.selectedClusters }} />
    </div>
  );
}

interface ClusterSectionProps {
  scope: PlatformScope;
  cluster: string;
  rows: NamespaceRow[];
}

function ClusterSection({ scope, cluster, rows }: ClusterSectionProps) {
  const bySeverity = (left: NamespaceRow, right: NamespaceRow) => compareBySeverityCounts(left.counts, right.counts);
  const own = rows.filter((row) => row.stage !== null || row.managed).sort(bySeverity);
  const other = rows.filter((row) => row.stage === null && !row.managed).sort(bySeverity);

  return (
    <Card className="p-0" data-testid={`cluster-${cluster}`}>
      <TableUI aria-label={`Namespaces of cluster ${cluster}`}>
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI scope="col" className={HEAD_CLASS}>
              Cluster {cluster}
              {installationClusters(scope).includes(cluster) && (
                <Badge variant="info" className="ml-2">
                  This installation
                </Badge>
              )}
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-48")}>
              Environment
            </TableHeadUI>
            <CountHeads />
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-12")}>
              <span className="sr-only">DefectDojo</span>
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          <NamespaceGroup scope={scope} title="Environments and managed namespaces" rows={own} />
          <NamespaceGroup scope={scope} title="Other namespaces of the cluster" rows={other} />
        </TableBodyUI>
      </TableUI>
    </Card>
  );
}

function NamespaceGroup({ scope, title, rows }: { scope: PlatformScope; title: string; rows: NamespaceRow[] }) {
  return (
    <>
      <TableRowUI className="bg-input/40 hover:bg-input/40">
        <TableCellUI className={cn(CELL_CLASS, "text-xs font-semibold")} colSpan={8}>
          {title} ({rows.length})
        </TableCellUI>
      </TableRowUI>
      {rows.map((row) => (
        <TableRowUI key={row.product.id} data-testid={`namespace-row-${row.cluster}-${row.namespace}`}>
          <TableCellUI className={cn(CELL_CLASS, "text-sm font-medium break-all")}>
            <span className="flex flex-wrap items-center gap-2">
              {row.namespace}
              {row.counts?.total === 0 && <CleanScanBadge />}
            </span>
          </TableCellUI>
          <TableCellUI className={CELL_CLASS}>
            {row.stage && <EnvironmentFindingsLink scope={scope} stage={row.stage} />}
            {!row.stage && row.managed && <Badge variant="info">Managed, no Stage</Badge>}
            {!row.stage && !row.managed && <span className="text-muted-foreground text-xs">{PROTOTYPE_NO_VALUE}</span>}
          </TableCellUI>
          <CountCells counts={row.counts} />
          <TableCellUI className={CELL_CLASS}>
            <DefectDojoLink href={row.product.url} label={`Product ${row.product.name}`} />
          </TableCellUI>
        </TableRowUI>
      ))}
    </>
  );
}

function CodebaseInventory({ scope, model }: { scope: PlatformScope; model: PlatformModel }) {
  if (model.codebasesState === "loading" || model.codebasesState === "notRequested") {
    return (
      <div className="flex justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }
  if (model.codebasesState === "unreachable") {
    return <UnreachableState what="Code and Image findings" onRetry={model.retry} />;
  }

  const scanned = new Set(model.codebases.map((codebase) => codebase.codebaseName));
  const notScanned = scope.codebases.filter((name) => !scanned.has(name)).sort();

  return (
    <Card className="p-0" data-testid="codebase-inventory">
      <TableUI aria-label="Code and Image scans by codebase">
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-44")}>
              Codebase
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-20")}>
              Level
            </TableHeadUI>
            <TableHeadUI scope="col" className={HEAD_CLASS}>
              Scan
            </TableHeadUI>
            <CountHeads />
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-40")}>
              Last scan
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-12")}>
              <span className="sr-only">DefectDojo</span>
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          {model.codebases.flatMap((codebase) =>
            codebase.tests.map((test, index) => {
              const counts = model.testCounts.get(test.id)?.active ?? null;
              const image = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.ociImage);
              return (
                <TableRowUI key={test.id}>
                  <TableCellUI className={CELL_CLASS}>
                    {index === 0 &&
                      (codebase.known ? (
                        <CodebaseFindingsLink scope={scope} codebaseName={codebase.codebaseName} />
                      ) : (
                        <span className="text-xs break-all">{codebase.codebaseName}</span>
                      ))}
                  </TableCellUI>
                  <TableCellUI className={cn(CELL_CLASS, "text-xs")}>
                    {test.level ? PROTOTYPE_LEVEL_META[test.level].label : PROTOTYPE_NO_VALUE}
                  </TableCellUI>
                  <TableCellUI className={CELL_CLASS}>
                    <div className="flex min-w-0 flex-col">
                      <span className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        {test.scanType}
                        {counts?.total === 0 && <CleanScanBadge />}
                      </span>
                      <span className="text-muted-foreground text-xs break-all">
                        Branch {test.branchTag || PROTOTYPE_NO_VALUE}
                        {image && `, image ${image}`}
                        {test.version && ` : ${test.version}`}
                      </span>
                    </div>
                  </TableCellUI>
                  <CountCells counts={counts} />
                  <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>
                    {formatScanTime(test.updated)}
                  </TableCellUI>
                  <TableCellUI className={CELL_CLASS}>
                    <DefectDojoLink href={test.url} label={`Test ${test.id}`} />
                  </TableCellUI>
                </TableRowUI>
              );
            })
          )}
          {notScanned.map((name) => (
            <TableRowUI key={name} className="hover:bg-transparent" data-testid={`codebase-no-data-${name}`}>
              <TableCellUI className={CELL_CLASS}>
                <CodebaseFindingsLink scope={scope} codebaseName={name} />
              </TableCellUI>
              <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>
                {PROTOTYPE_NO_VALUE}
              </TableCellUI>
              <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>
                No scan data. The CI security pipeline has not reported findings for this codebase.
              </TableCellUI>
              <CountCells counts={null} />
              <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>
                {PROTOTYPE_NO_VALUE}
              </TableCellUI>
              <TableCellUI className={CELL_CLASS} />
            </TableRowUI>
          ))}
        </TableBodyUI>
      </TableUI>
    </Card>
  );
}
