// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { Link } from "@tanstack/react-router";
import { ChevronRight, ShieldAlert } from "lucide-react";
import type { PrototypeDefectDojoLevel } from "@my-project/shared";
import type { PrototypeDefectDojoApi } from "@/modules/platform/security/prototype-defectdojo/api/context";
import { PrototypeDefectDojoProvider } from "@/modules/platform/security/prototype-defectdojo/api/provider";
import { SeverityCountChip } from "@/modules/platform/security/prototype-defectdojo/components/SeverityCounts";
import { CleanScanBadge } from "@/modules/platform/security/prototype-defectdojo/components/StateBlocks";
import { PROTOTYPE_LEVEL_META, PROTOTYPE_NO_VALUE } from "@/modules/platform/security/prototype-defectdojo/constants";
import { PATH_PROJECT_DETAILS_FULL } from "../../../route";
import { codebaseDigests, type LevelDigest } from "../digest";
import { useCodebaseFindingsModel } from "../hooks/useCodebaseFindingsModel";
import type { CodebaseFindingsScope } from "../types";

const LEVELS: PrototypeDefectDojoLevel[] = ["code", "image", "runtime"];

export interface CodebaseSecurityLineProps {
  scope: CodebaseFindingsScope;
  /** Route parameter `clusterName` of the portal. */
  portalClusterName: string;
  /** Default: the tRPC client. Stories pass a fixture-backed API. */
  api?: PrototypeDefectDojoApi;
}

/**
 * One line on the codebase Overview tab: the state of Code, Image and Runtime. The whole line is a
 * link to the Security Findings tab. It stays one line in every state.
 */
export function CodebaseSecurityLine({ scope, portalClusterName, api }: CodebaseSecurityLineProps) {
  return (
    <PrototypeDefectDojoProvider api={api} cacheScope="codebase-overview-line">
      <Link
        to={PATH_PROJECT_DETAILS_FULL}
        params={{ clusterName: portalClusterName, namespace: scope.namespace, name: scope.codebaseName }}
        search={{ tab: "findings" }}
        data-testid="codebase-security-line"
        aria-label={`Security findings of ${scope.codebaseName}. Open the Security Findings tab`}
        className="bg-card hover:border-primary/50 focus-visible:ring-ring flex h-10 items-center gap-4 overflow-hidden rounded-lg border px-4 text-sm whitespace-nowrap shadow-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-foreground flex shrink-0 items-center gap-2 font-medium">
          <ShieldAlert className="size-4" aria-hidden />
          Security findings
        </span>
        <LineContent scope={scope} />
        <ChevronRight className="text-muted-foreground ml-auto size-4 shrink-0" aria-hidden />
      </Link>
    </PrototypeDefectDojoProvider>
  );
}

function LineContent({ scope }: { scope: CodebaseFindingsScope }) {
  const model = useCodebaseFindingsModel(scope, { withInactive: false });

  if (model.connection === "notConfigured") {
    return <span className="text-muted-foreground truncate">DefectDojo is not connected</span>;
  }

  const digests = codebaseDigests(scope, model);
  if (LEVELS.every((level) => digests[level].kind === "unreachable")) {
    return <span className="text-destructive truncate">DefectDojo is unreachable</span>;
  }

  return (
    <>
      {LEVELS.map((level) => (
        <span key={level} className="flex min-w-0 items-center gap-2" data-testid={`line-${level}`}>
          <span className="text-muted-foreground shrink-0 text-xs font-medium">
            {PROTOTYPE_LEVEL_META[level].label}
          </span>
          <DigestPhrase digest={digests[level]} />
        </span>
      ))}
    </>
  );
}

function DigestPhrase({ digest }: { digest: LevelDigest }) {
  switch (digest.kind) {
    case "loading":
      return <span className="text-muted-foreground text-xs">Loading</span>;
    case "unreachable":
      return <span className="text-destructive text-xs">Unreachable</span>;
    case "noData":
      return <span className="text-muted-foreground text-xs">{PROTOTYPE_NO_VALUE} No scan data</span>;
    case "notRunning":
      return <span className="text-muted-foreground text-xs">Not running</span>;
    case "clean":
      return <CleanScanBadge />;
    case "findings":
      return (
        <>
          <SeverityCountChip severity={digest.severity} count={digest.count} label={digest.severity} />
          <span className="text-muted-foreground truncate text-xs">
            {digest.scan}
            {digest.environment && `, ${digest.environment}`}
          </span>
        </>
      );
  }
}
