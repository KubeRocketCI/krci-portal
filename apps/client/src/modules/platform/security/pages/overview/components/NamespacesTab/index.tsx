import {
  DEFECTDOJO_SEVERITIES,
  hasActiveFindings,
  isOwnNamespace,
  totalOf,
  type OverviewNamespace,
} from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import {
  CELL_CLASS,
  DEFECTDOJO_STATE_TEXT,
  HEAD_CLASS,
  NO_VALUE,
} from "@/modules/platform/security/components/defectdojo/constants";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { EnvironmentLink } from "@/modules/platform/security/components/defectdojo/FoundIn";
import {
  SeverityCountCells,
  SeverityHeadCells,
} from "@/modules/platform/security/components/defectdojo/SeverityCountCells";
import { NoFindingsBadge } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import {
  NamespaceExposedSecretsLink,
  NamespaceVulnerabilitiesLink,
} from "@/modules/platform/security/components/defectdojo/ListLinks";
import { placeLabel } from "@/modules/platform/security/components/defectdojo/utils";
import type { LinkContext } from "../../utils/links";
import { Note } from "../Note";

/** Namespace, Environment, a column per severity, exposed secrets, links. */
const COLUMN_COUNT = 4 + DEFECTDOJO_SEVERITIES.length;

interface RowProps {
  row: OverviewNamespace;
  links: LinkContext;
}

/** The Environment of a namespace, or whether the installation manages it. */
export function NamespaceKind({ row, links }: RowProps) {
  if (row.environment) {
    return (
      <EnvironmentLink clusterName={links.clusterName} namespace={links.namespace} environment={row.environment} />
    );
  }
  return row.managed ? (
    <Badge variant="info">Managed</Badge>
  ) : (
    <span className="text-muted-foreground text-xs">{NO_VALUE}</span>
  );
}

/** The exposed secrets of a namespace, linked to their list, or a dash without a namespace product. */
export function SecretsCount({ row, links }: RowProps) {
  if (row.product === null) {
    return <span className="text-muted-foreground text-xs">{NO_VALUE}</span>;
  }
  const count = totalOf(row.product.secrets);
  return count === 0 ? (
    <span className="text-muted-foreground text-sm">0</span>
  ) : (
    <NamespaceExposedSecretsLink place={row} clusterName={links.clusterName} filters={links} text={String(count)} />
  );
}

function NamespaceRow({ row, links }: RowProps) {
  const { product } = row;
  const clean = product !== null && !hasActiveFindings(product.vulnerabilities) && !hasActiveFindings(product.secrets);

  return (
    <TableRowUI data-testid={`namespace-row-${row.cluster}-${row.namespace}`}>
      <TableCellUI className={cn(CELL_CLASS, "text-sm font-medium break-all")}>
        <span className="flex flex-wrap items-center gap-2">
          {row.namespace}
          {clean && <NoFindingsBadge />}
          {product === null && (
            <span className="text-muted-foreground text-xs font-normal">{DEFECTDOJO_STATE_TEXT.noScanData}</span>
          )}
        </span>
      </TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        <NamespaceKind row={row} links={links} />
      </TableCellUI>
      <SeverityCountCells counts={product?.vulnerabilities ?? null} />
      <TableCellUI className={cn(CELL_CLASS, "text-center")}>
        <SecretsCount row={row} links={links} />
      </TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        {product && (
          <span className="flex items-center gap-2">
            <NamespaceVulnerabilitiesLink place={row} clusterName={links.clusterName} filters={links} />
            <DefectDojoLink href={product.url} label={`Product ${placeLabel(row)}`} />
          </span>
        )}
      </TableCellUI>
    </TableRowUI>
  );
}

function NamespaceGroup({ title, rows, links }: { title: string; rows: OverviewNamespace[]; links: LinkContext }) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <>
      <TableRowUI className="bg-input/40 hover:bg-input/40">
        <TableHeadUI scope="rowgroup" colSpan={COLUMN_COUNT} className="px-3 py-2 text-xs font-semibold">
          {title} ({rows.length})
        </TableHeadUI>
      </TableRowUI>
      {rows.map((row) => (
        <NamespaceRow key={`${row.cluster}/${row.namespace}`} row={row} links={links} />
      ))}
    </>
  );
}

function ClusterSection({ cluster, rows, links }: { cluster: string; rows: OverviewNamespace[]; links: LinkContext }) {
  return (
    <Card className="p-0" data-testid={`cluster-${cluster}`}>
      <TableUI aria-label={`Namespaces of cluster ${cluster}`} className="min-w-[56rem]">
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI scope="col" className={HEAD_CLASS}>
              Cluster {cluster}
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-48")}>
              Environment
            </TableHeadUI>
            <SeverityHeadCells />
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-28 text-center")}>
              Exposed secrets
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-20")}>
              <span className="sr-only">Links</span>
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          <NamespaceGroup
            title="Environments and managed namespaces"
            rows={rows.filter(isOwnNamespace)}
            links={links}
          />
          <NamespaceGroup title="Other namespaces" rows={rows.filter((row) => !isOwnNamespace(row))} links={links} />
        </TableBodyUI>
      </TableUI>
    </Card>
  );
}

export interface NamespacesTabProps {
  /** The namespaces in view, in the order of the tab. */
  rows: OverviewNamespace[];
  links: LinkContext;
}

/** A section per cluster: the Environments and the managed namespaces first, then the others of the cluster. */
export function NamespacesTab({ rows, links }: NamespacesTabProps) {
  const clusters = [...new Set(rows.map((row) => row.cluster))];

  if (clusters.length === 0) {
    return <Note>No namespace matches the filters.</Note>;
  }
  return (
    <div className="space-y-4">
      {clusters.map((cluster) => (
        <ClusterSection
          key={cluster}
          cluster={cluster}
          rows={rows.filter((row) => row.cluster === cluster)}
          links={links}
        />
      ))}
    </div>
  );
}
