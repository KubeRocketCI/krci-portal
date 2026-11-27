import type { ReactNode } from "react";
import {
  runtimeLines,
  scanTypeLines,
  type CodebaseScanLevel,
  type DefectDojoLevel,
  type OverviewCodebase,
  type OverviewNamespace,
} from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { plural } from "@/core/utils/format/plural";
import { LEVEL_META } from "@/modules/platform/security/components/defectdojo/constants";
import { CardLineRow } from "@/modules/platform/security/components/defectdojo/CardLineRow";
import { ExposedSecretsLink, VulnerabilitiesLink } from "@/modules/platform/security/components/defectdojo/ListLinks";
import { RuntimeLines } from "@/modules/platform/security/components/defectdojo/RuntimeLines";
import { namespaceListSearch } from "@/modules/platform/security/components/defectdojo/searchParams";
import { NoScanDataState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { CODEBASES_PART } from "../../constants";
import { codebaseListSearch, type LinkContext } from "../../utils/links";
import { isSecretScanType, type ViewFilters } from "../../utils/model";
import { ScanListLink } from "../ScanListLink";
import { Note } from "../Note";

/** What a level card of the platform adds up. */
const CARD_SUBJECT: Record<DefectDojoLevel, string> = {
  runtime: "Workloads that run in the namespaces in view",
  image: "Images the CI security scan scanned, of the codebases in view",
  code: "Source code of the branches of the codebases in view",
};

export interface LevelCardProps {
  level: DefectDojoLevel;
  /** The lines of the card, or the state of its part. */
  children: ReactNode;
}

export function LevelCard({ level, children }: LevelCardProps) {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;

  return (
    <Card className="space-y-2 p-4" data-testid={`level-card-${level}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div>
          <h3 className="text-foreground text-sm font-semibold">{meta.label}</h3>
          <p className="text-muted-foreground text-xs">{CARD_SUBJECT[level]}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

export interface RuntimeLevelCardProps {
  /** The namespaces in view. */
  rows: OverviewNamespace[];
  filters: ViewFilters;
  secretsTruncated: boolean;
  links: LinkContext;
  /** The state of the Runtime part, in place of the lines. */
  placeholder: ReactNode | null;
}

/** Two lines of Trivy Operator Scan: the vulnerabilities and, apart, the exposed secrets of the namespaces in view. */
export function RuntimeLevelCard({ rows, filters, secretsTruncated, links, placeholder }: RuntimeLevelCardProps) {
  const lines = runtimeLines(rows);
  // The lists have no Environment filter: they open on its namespace.
  const environmentPlace = filters.environment ? rows[0] : undefined;
  const listSearch = environmentPlace
    ? namespaceListSearch(environmentPlace, links)
    : { cluster: [...filters.clusters], namespace: filters.namespace, severity: links.severity, state: links.state };

  if (placeholder) {
    return <LevelCard level="runtime">{placeholder}</LevelCard>;
  }
  return (
    <LevelCard level="runtime">
      {lines ? (
        <RuntimeLines
          vulnerabilities={lines.vulnerabilities}
          secrets={lines.secrets}
          secretsTruncated={secretsTruncated}
          scope={plural(lines.size, "namespace")}
          vulnerabilitiesLink={
            <VulnerabilitiesLink
              clusterName={links.clusterName}
              search={{ level: "runtime", ...listSearch }}
              label="Runtime vulnerabilities"
            />
          }
          secretsLink={
            <ExposedSecretsLink clusterName={links.clusterName} search={listSearch} label="Runtime exposed secrets" />
          }
        />
      ) : (
        <Note>{rows.length === 0 ? "No namespace matches the filters." : "No namespace in view has scan data."}</Note>
      )}
    </LevelCard>
  );
}

export interface ScanLevelCardProps {
  level: CodebaseScanLevel;
  /** The codebases in view. */
  codebases: OverviewCodebase[];
  /** A scan of the level is in the part, though maybe not in view. */
  levelScanned: boolean;
  /** The codebase filter, which the lists open with. */
  codebase: string | undefined;
  links: LinkContext;
  /** The state of the Codebases part, in place of the lines. */
  placeholder: ReactNode | null;
}

export function ScanLevelCard({ level, codebases, levelScanned, codebase, links, placeholder }: ScanLevelCardProps) {
  const lines = scanTypeLines(codebases, level);
  const findings = LEVEL_META[level].findings;

  if (placeholder) {
    return <LevelCard level={level}>{placeholder}</LevelCard>;
  }
  if (lines.length === 0) {
    return (
      <LevelCard level={level}>
        {levelScanned ? (
          <Note>No scan matches the filters.</Note>
        ) : (
          <NoScanDataState producer={LEVEL_META[level].producer} what={findings} subject={CODEBASES_PART.subject} />
        )}
      </LevelCard>
    );
  }
  return (
    <LevelCard level={level}>
      {lines.map((line) => (
        <CardLineRow
          key={line.scanType}
          name={line.scanType}
          detail={plural(line.size, "scan")}
          counts={line.counts}
          link={
            <ScanListLink
              clusterName={links.clusterName}
              scanType={line.scanType}
              level={level}
              search={codebaseListSearch(codebase, links)}
              label={`${LEVEL_META[level].label} ${isSecretScanType(line.scanType) ? "exposed secrets" : "vulnerabilities"} (${line.scanType})`}
            />
          }
        />
      ))}
    </LevelCard>
  );
}
