import {
  CODEBASE_SCAN_LEVELS,
  type CodebaseFindingsInput,
  type SecurityLineRuntime,
  type SecurityLineScanLevel,
} from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import {
  DEFECTDOJO_STATE_TEXT,
  LEVEL_META,
  NO_VALUE,
  RUNTIME_REPORT_KIND_LABELS,
} from "@/modules/platform/security/components/defectdojo/constants";
import { NoFindingsBadge, RetryIconButton } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { environmentLabel } from "@/modules/platform/security/components/defectdojo/utils";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { PATH_PROJECT_DETAILS_FULL } from "../../../../route";
import { useCodebaseSecurityLine } from "../../hooks/useCodebaseSecurityLine";

const LEVELS = [...CODEBASE_SCAN_LEVELS, "runtime"] as const;

type LinePhrase = SecurityLineScanLevel | SecurityLineRuntime;

export interface SecurityLineProps {
  codebase: CodebaseFindingsInput;
  /** The portal cluster the link opens in. */
  clusterName: string;
}

function findingDetail(phrase: Extract<LinePhrase, { state: "data" }>): string {
  return "scanner" in phrase
    ? phrase.scanner
    : `${RUNTIME_REPORT_KIND_LABELS[phrase.reportKind].toLowerCase()}, ${environmentLabel(phrase.environment)}`;
}

function phraseText(phrase: LinePhrase): string {
  return phrase.state === "data"
    ? `${phrase.severity} ${phrase.count}, ${findingDetail(phrase)}`
    : DEFECTDOJO_STATE_TEXT[phrase.state];
}

/** The line in words: the row keeps one line and cuts its phrases, so the link's tooltip carries them whole. */
function lineTitle(levels: Record<(typeof LEVELS)[number], LinePhrase>): string {
  return LEVELS.map((level) => `${LEVEL_META[level].label}: ${phraseText(levels[level])}`).join("; ");
}

function Note({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground truncate text-xs">{children}</span>;
}

function LevelPhrase({ phrase }: { phrase: LinePhrase }) {
  switch (phrase.state) {
    case "noScanData":
      return (
        <Note>
          {NO_VALUE} {DEFECTDOJO_STATE_TEXT.noScanData}
        </Note>
      );
    case "notRunning":
      return <Note>{DEFECTDOJO_STATE_TEXT.notRunning}</Note>;
    case "clean":
      return <NoFindingsBadge label={DEFECTDOJO_STATE_TEXT.clean} />;
    case "data":
      return (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-xs font-medium">{phrase.severity}</span>
          <SeverityCountBadge severity={phrase.severity} count={phrase.count} />
          <Note>{findingDetail(phrase)}</Note>
        </span>
      );
  }
}

/** The Retry button sits above the stretched link that covers the row, also while it is disabled. */
function Failure({ text, onRetry, isRetrying }: { text: string; onRetry: () => void; isRetrying: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="text-destructive truncate text-xs">{text}</span>
      <RetryIconButton
        className="pointer-events-auto relative z-10 disabled:pointer-events-auto"
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    </span>
  );
}

/** The first row of the Overview tab: the state of each level. */
export function SecurityLine({ codebase, clusterName }: SecurityLineProps) {
  const query = useCodebaseSecurityLine(codebase);
  const line = query.data;
  const retry = { onRetry: () => void query.refetch(), isRetrying: query.isFetching };

  let content: ReactNode;
  if (line === undefined) {
    content = query.isError ? (
      <Failure text={DEFECTDOJO_STATE_TEXT.loadFailed} {...retry} />
    ) : (
      <LoadingSpinner size={16} />
    );
  } else if (line.state === "notConfigured") {
    content = <Note>{DEFECTDOJO_STATE_TEXT.notConfigured}</Note>;
  } else if (line.state === "unreachable") {
    content = <Failure text={DEFECTDOJO_STATE_TEXT.unreachable} {...retry} />;
  } else {
    content = LEVELS.map((level) => (
      <span key={level} className="flex min-w-0 items-center gap-2" data-testid={`line-${level}`}>
        <span className="text-muted-foreground shrink-0 text-xs font-medium">{LEVEL_META[level].label}</span>
        <LevelPhrase phrase={line.levels[level]} />
      </span>
    ));
  }

  return (
    <Card
      className="hover:border-primary/50 relative flex h-10 items-center gap-4 border px-4 text-sm whitespace-nowrap"
      data-testid="codebase-security-line"
    >
      <Link
        to={PATH_PROJECT_DETAILS_FULL}
        params={{ clusterName, namespace: codebase.namespace, name: codebase.name }}
        search={{ tab: "findings" }}
        aria-label={`Security findings of ${codebase.name}`}
        title={line?.state === "data" ? lineTitle(line.levels) : undefined}
        className="focus-visible:ring-ring absolute inset-0 rounded-lg focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      />
      <span className="pointer-events-none flex shrink-0 items-center gap-2 font-medium">
        <ShieldAlert className="size-4" aria-hidden />
        Security findings
      </span>
      <span className="pointer-events-none flex min-w-0 items-center gap-4">{content}</span>
      <ChevronRight className="text-muted-foreground pointer-events-none ml-auto size-4 shrink-0" aria-hidden />
    </Card>
  );
}
