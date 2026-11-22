// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Overview variant A, "Dashboard": severity tiles of the Runtime findings, one card per level with
// its scan types, then the top namespaces and the top codebases side by side.
import { Link } from "@tanstack/react-router";
import type { PrototypeDefectDojoLevel, PrototypeDefectDojoSeverityCounts } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { getSeverityBadgeClasses } from "@/modules/platform/security/constants/severity";
import { PATH_TRIVY_EXPOSED_SECRETS_FULL } from "@/modules/platform/security/pages/trivy-exposed-secrets/route";
import { PATH_TRIVY_VULNERABILITIES_FULL } from "@/modules/platform/security/pages/trivy-vulnerabilities/route";
import { DefectDojoLink } from "../../components/DefectDojoLink";
import { PrototypeStatePanel } from "../../components/PrototypeStatePanel";
import { SeverityCounts } from "../../components/SeverityCounts";
import { CleanScanBadge, NoScanDataState, NotConfiguredState, UnreachableState } from "../../components/StateBlocks";
import { PROTOTYPE_LEVEL_META, PROTOTYPE_NO_VALUE, PROTOTYPE_SEVERITY_KEYS } from "../../constants";
import { toSeverityLevel } from "../../utils";
import { ClusterFilter } from "../components/ClusterFilter";
import { CodebaseFindingsLink, EnvironmentFindingsLink } from "../components/PlaceLinks";
import { usePlatformModel } from "../hooks/usePlatformModel";
import { compareBySeverityCounts, installationClusters, scanTypeTotals, type ScanTypeTotal } from "../model";
import type { CodebaseRow, NamespaceRow, PlatformModel, PlatformScope, SecurityPageProps } from "../types";

const TOP_ROWS = 10;
const HEAD_CLASS = "bg-muted text-muted-foreground px-3 py-2 text-xs font-medium";
const CELL_CLASS = "px-3 py-2 align-top";

export function OverviewVariantA({ scope, pickedClusters, onClustersChange, note }: SecurityPageProps) {
  const model = usePlatformModel(scope, pickedClusters, {
    runtimeTotal: true,
    namespaceCounts: true,
    codebases: "counts",
  });

  if (model.connection === "notConfigured") {
    return <NotConfiguredState />;
  }

  const totals = scanTypeTotals(model.codebases, model.testCounts);
  const topNamespaces = [...model.namespaces]
    .sort((left, right) => compareBySeverityCounts(left.counts, right.counts))
    .slice(0, TOP_ROWS);

  return (
    <div className="space-y-4">
      {note && <Alert>{note}</Alert>}
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
          <section aria-label="Runtime findings by severity" className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {PROTOTYPE_SEVERITY_KEYS.map(({ severity, key }) => (
              <Card key={severity} className="p-4" data-testid={`tile-${key}`}>
                <p
                  className={cn(
                    "w-fit rounded px-2 text-3xl font-bold",
                    model.runtimeTotal && model.runtimeTotal[key] > 0
                      ? getSeverityBadgeClasses(toSeverityLevel(severity)).combined
                      : "text-muted-foreground"
                  )}
                >
                  {model.runtimeTotal ? model.runtimeTotal[key].toLocaleString() : PROTOTYPE_NO_VALUE}
                </p>
                <p className="text-foreground mt-1 text-sm font-medium">{severity}</p>
                <p className="text-muted-foreground text-xs">Running workloads, {model.namespaces.length} namespaces</p>
              </Card>
            ))}
          </section>

          <section aria-label="Findings by level" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <LevelCard level="code" model={model} totals={totals} />
            <LevelCard level="image" model={model} totals={totals} />
            <Card className="space-y-2 p-4" data-testid="level-runtime">
              <LevelHeading level="runtime" />
              <ScanTypeLine
                name="Trivy Operator Scan"
                detail={`${model.namespaces.length} namespaces`}
                counts={model.runtimeTotal}
              />
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="space-y-2 p-4" data-testid="top-namespaces">
              <div className="flex items-center gap-3">
                <h3 className="text-foreground text-sm font-semibold">Top namespaces (Runtime)</h3>
                <Link
                  to={PATH_TRIVY_VULNERABILITIES_FULL}
                  params={{ clusterName: scope.portalClusterName }}
                  search={{ variant: "A" }}
                  className="text-secondary-dark hover:text-primary ml-auto text-xs underline-offset-4 hover:underline"
                >
                  All vulnerabilities
                </Link>
                <Link
                  to={PATH_TRIVY_EXPOSED_SECRETS_FULL}
                  params={{ clusterName: scope.portalClusterName }}
                  search={{ variant: "A" }}
                  className="text-secondary-dark hover:text-primary text-xs underline-offset-4 hover:underline"
                >
                  Exposed secrets
                </Link>
              </div>
              <NamespaceTable scope={scope} rows={topNamespaces} />
            </Card>

            <Card className="space-y-2 p-4" data-testid="top-codebases">
              <h3 className="text-foreground text-sm font-semibold">Codebases (Code and Image)</h3>
              {model.codebasesState === "loading" && <LoadingSpinner size={24} />}
              {model.codebasesState === "unreachable" && (
                <UnreachableState compact what="Code and Image findings" onRetry={model.retry} />
              )}
              {model.codebasesState === "noData" && <NoScanDataState level="image" subject="this installation" />}
              {model.codebasesState === "data" && <CodebaseTable scope={scope} model={model} />}
            </Card>
          </section>
        </>
      )}

      <PrototypeStatePanel state={{ scope, selectedClusters: model.selectedClusters }} />
    </div>
  );
}

function LevelHeading({ level }: { level: PrototypeDefectDojoLevel }) {
  const meta = PROTOTYPE_LEVEL_META[level];
  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <h3 className="text-foreground text-sm font-semibold">{meta.label}</h3>
        <p className="text-muted-foreground text-xs">{meta.subject}</p>
      </div>
    </div>
  );
}

interface ScanTypeLineProps {
  name: string;
  detail: string;
  counts: PrototypeDefectDojoSeverityCounts | null;
}

function ScanTypeLine({ name, detail, counts }: ScanTypeLineProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5">
      <span className="text-xs font-medium">{name}</span>
      <span className="text-muted-foreground text-xs">{detail}</span>
      <span className="ml-auto">{counts?.total === 0 ? <CleanScanBadge /> : <SeverityCounts counts={counts} />}</span>
    </div>
  );
}

/** Code or Image: one line per scan type. Scan types are not added up. */
function LevelCard({
  level,
  model,
  totals,
}: {
  level: "code" | "image";
  model: PlatformModel;
  totals: ScanTypeTotal[];
}) {
  const levelTotals = totals.filter((total) => total.level === level);

  return (
    <Card className="space-y-2 p-4" data-testid={`level-${level}`}>
      <LevelHeading level={level} />
      {model.codebasesState === "loading" && <LoadingSpinner size={20} />}
      {model.codebasesState === "unreachable" && (
        <UnreachableState compact what={`${PROTOTYPE_LEVEL_META[level].label} findings`} onRetry={model.retry} />
      )}
      {(model.codebasesState === "noData" || (model.codebasesState === "data" && levelTotals.length === 0)) && (
        <NoScanDataState level={level} subject="this installation" />
      )}
      {levelTotals.map((total) => (
        <ScanTypeLine
          key={total.scanType}
          name={total.scanType}
          detail={`${total.scans} scans, ${model.codebases.length} codebases`}
          counts={total.counts}
        />
      ))}
    </Card>
  );
}

function NamespaceKind({ scope, row }: { scope: PlatformScope; row: NamespaceRow }) {
  if (row.stage) {
    return <EnvironmentFindingsLink scope={scope} stage={row.stage} />;
  }
  return <Badge variant={row.managed ? "info" : "neutral"}>{row.managed ? "Managed" : "Other namespace"}</Badge>;
}

function NamespaceTable({ scope, rows }: { scope: PlatformScope; rows: NamespaceRow[] }) {
  return (
    <TableUI aria-label="Top namespaces by Runtime findings">
      <TableHeaderUI>
        <TableRowUI>
          <TableHeadUI scope="col" className={HEAD_CLASS}>
            Cluster / namespace
          </TableHeadUI>
          <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-36")}>
            Environment
          </TableHeadUI>
          <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-60")}>
            Active findings
          </TableHeadUI>
          <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-10")}>
            <span className="sr-only">DefectDojo</span>
          </TableHeadUI>
        </TableRowUI>
      </TableHeaderUI>
      <TableBodyUI>
        {rows.map((row) => (
          <TableRowUI key={row.product.id}>
            <TableCellUI className={cn(CELL_CLASS, "text-xs font-medium break-all")}>
              {row.cluster} / {row.namespace}
            </TableCellUI>
            <TableCellUI className={CELL_CLASS}>
              <NamespaceKind scope={scope} row={row} />
            </TableCellUI>
            <TableCellUI className={CELL_CLASS}>
              {row.counts?.total === 0 ? <CleanScanBadge /> : <SeverityCounts counts={row.counts} />}
            </TableCellUI>
            <TableCellUI className={CELL_CLASS}>
              <DefectDojoLink href={row.product.url} label={`Product ${row.product.name}`} />
            </TableCellUI>
          </TableRowUI>
        ))}
      </TableBodyUI>
    </TableUI>
  );
}

function CodebaseTable({ scope, model }: { scope: PlatformScope; model: PlatformModel }) {
  return (
    <TableUI aria-label="Codebases by Code and Image findings">
      <TableHeaderUI>
        <TableRowUI>
          <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-40")}>
            Codebase
          </TableHeadUI>
          <TableHeadUI scope="col" className={HEAD_CLASS}>
            Scans (counts per scan)
          </TableHeadUI>
          <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-10")}>
            <span className="sr-only">DefectDojo</span>
          </TableHeadUI>
        </TableRowUI>
      </TableHeaderUI>
      <TableBodyUI>
        {model.codebases.slice(0, TOP_ROWS).map((codebase) => (
          <CodebaseTableRow key={codebase.codebaseName} scope={scope} codebase={codebase} model={model} />
        ))}
      </TableBodyUI>
    </TableUI>
  );
}

function CodebaseTableRow({
  scope,
  codebase,
  model,
}: {
  scope: PlatformScope;
  codebase: CodebaseRow;
  model: PlatformModel;
}) {
  // The scans with findings, most severe first; clean scans are counted.
  const withCounts = codebase.tests.map((test) => ({ test, counts: model.testCounts.get(test.id)?.active ?? null }));
  const dirty = withCounts
    .filter((item) => item.counts === null || item.counts.total > 0)
    .sort((left, right) => compareBySeverityCounts(left.counts, right.counts));
  const cleanCount = withCounts.length - dirty.length;

  return (
    <TableRowUI>
      <TableCellUI className={CELL_CLASS}>
        {codebase.known ? (
          <CodebaseFindingsLink scope={scope} codebaseName={codebase.codebaseName} />
        ) : (
          <span className="text-xs break-all">{codebase.codebaseName}</span>
        )}
      </TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        <ul className="space-y-1">
          {dirty.map(({ test, counts }) => (
            <li key={test.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">{test.scanType}</span>
              <SeverityCounts counts={counts} />
            </li>
          ))}
          {cleanCount > 0 && (
            <li className="flex items-center gap-2 text-xs">
              <CleanScanBadge />
              {cleanCount} scans
            </li>
          )}
        </ul>
      </TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        <DefectDojoLink href={codebase.product.url} label={`Product ${codebase.product.name}`} />
      </TableCellUI>
    </TableRowUI>
  );
}
