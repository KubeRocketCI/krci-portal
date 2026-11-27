import type { ReactNode } from "react";
import type { OverviewCodebase, OverviewNamespace, OverviewScan } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { NamespaceVulnerabilitiesLink } from "@/modules/platform/security/components/defectdojo/ListLinks";
import { SeverityCountsRow } from "@/modules/platform/security/components/defectdojo/SeverityCountsRow";
import { placeLabel } from "@/modules/platform/security/components/defectdojo/utils";
import { TOP_CODEBASES_TITLE, TOP_NAMESPACES_TITLE } from "../../constants";
import { codebaseListSearch, type LinkContext } from "../../utils/links";
import { scanTarget } from "../../utils/model";
import { CodebaseName } from "../CodebasesTab";
import { ScanListLink } from "../ScanListLink";
import { NamespaceKind, SecretsCount } from "../NamespacesTab";
import { Note } from "../Note";

export function TopCard({ title, testId, children }: { title: string; testId: string; children: ReactNode }) {
  return (
    <Card className="space-y-3 p-4" data-testid={testId}>
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      {children}
    </Card>
  );
}

export function TopNamespaces({ rows, links }: { rows: OverviewNamespace[]; links: LinkContext }) {
  if (rows.length === 0) {
    return <Note>No namespace in view has a finding.</Note>;
  }
  return (
    <ol className="space-y-2" aria-label={TOP_NAMESPACES_TITLE}>
      {rows.map((row) => (
        <li key={placeLabel(row)} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2 last:border-b-0">
          <NamespaceVulnerabilitiesLink
            place={row}
            clusterName={links.clusterName}
            filters={links}
            text={placeLabel(row)}
          />
          <NamespaceKind row={row} links={links} />
          <span className="ml-auto flex flex-wrap items-center gap-3">
            {row.product && (
              <SeverityCountsRow counts={row.product.vulnerabilities} label={`Vulnerabilities of ${placeLabel(row)}`} />
            )}
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              Secrets <SecretsCount row={row} links={links} />
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export interface TopCodebasesProps {
  entries: { codebase: OverviewCodebase; scan: OverviewScan }[];
  links: LinkContext;
}

/** Each codebase with its most severe scan: the scans of a codebase are not added. */
export function TopCodebases({ entries, links }: TopCodebasesProps) {
  if (entries.length === 0) {
    return <Note>No codebase in view has a finding.</Note>;
  }
  return (
    <ol className="space-y-2" aria-label={TOP_CODEBASES_TITLE}>
      {entries.map(({ codebase, scan }) => (
        <li
          key={codebase.codebase}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2 last:border-b-0"
        >
          <CodebaseName codebase={codebase.codebase} known={codebase.known} links={links} />
          <span className="text-muted-foreground text-xs break-all">
            {scan.ref.scanner}, {scanTarget(scan)}
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-3">
            <SeverityCountsRow counts={scan.counts} label={`${scan.ref.scanner} of ${codebase.codebase}`} />
            <ScanListLink
              clusterName={links.clusterName}
              scanType={scan.ref.scanner}
              level={scan.ref.level}
              search={codebaseListSearch(codebase.codebase, links)}
              label={`Findings of ${codebase.codebase}`}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}
