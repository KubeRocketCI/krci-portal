import type { EnvironmentSummaryData, EnvironmentSummaryInput } from "@my-project/shared";
import type { ReactNode } from "react";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { plural } from "@/core/utils/format/plural";
import { useEnvironmentSummary } from "@/modules/platform/cdpipelines/pages/stage-details/hooks/useEnvironmentSummary";
import { LEVEL_META } from "@/modules/platform/security/components/defectdojo/constants";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import {
  NamespaceExposedSecretsLink,
  NamespaceVulnerabilitiesLink,
} from "@/modules/platform/security/components/defectdojo/ListLinks";
import { RuntimeLines } from "@/modules/platform/security/components/defectdojo/RuntimeLines";
import {
  CleanLevelState,
  LoadFailedState,
  NotConfiguredState,
  NoScanDataState,
  UnreachableState,
} from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { placeLabel } from "@/modules/platform/security/components/defectdojo/utils";

export interface EnvironmentSecuritySummaryProps {
  environment: EnvironmentSummaryInput;
  /** The portal cluster the links open in. */
  clusterName: string;
}

function containersLine({ scanned, withoutCodebase, notRunning }: EnvironmentSummaryData["containers"]): string {
  return [
    `${plural(scanned, "workload container")} scanned`,
    withoutCodebase === null
      ? "codebases unknown (Applications cannot be read)"
      : `${withoutCodebase} without a codebase`,
    notRunning > 0 ? `${notRunning} not running` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function NamespaceFindings({ summary, clusterName }: { summary: EnvironmentSummaryData; clusterName: string }) {
  const { runtime, place } = summary;

  // The lists leave out the rows of closed tests: a link would open an empty list.
  if (runtime.state === "notRunning") {
    return <p className="text-muted-foreground text-sm">Not running: no workload of the namespace runs.</p>;
  }

  const vulnerabilitiesLink = <NamespaceVulnerabilitiesLink place={place} clusterName={clusterName} />;
  const secretsLink = <NamespaceExposedSecretsLink place={place} clusterName={clusterName} />;
  if (runtime.state === "clean") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <CleanLevelState lastUpload={runtime.lastUpload} />
        {vulnerabilitiesLink}
        {secretsLink}
      </div>
    );
  }
  return (
    <RuntimeLines
      vulnerabilities={runtime.vulnerabilities}
      secrets={runtime.secrets}
      secretsTruncated={runtime.secretsTruncated}
      vulnerabilitiesLink={vulnerabilitiesLink}
      secretsLink={secretsLink}
    />
  );
}

/**
 * The Runtime security card of the Overview tab: the active findings of the Stage's namespace product in DefectDojo, or
 * why there are none.
 */
export function EnvironmentSecuritySummary({ environment, clusterName }: EnvironmentSecuritySummaryProps) {
  const query = useEnvironmentSummary(environment);
  const meta = LEVEL_META.runtime;
  const Icon = meta.icon;

  const summary = query.data;
  const retry = { onRetry: () => void query.refetch(), isRetrying: query.isFetching };

  let content: ReactNode;
  if (summary === undefined) {
    content = query.isError ? (
      <LoadFailedState message={query.error.message} {...retry} />
    ) : (
      <LoadingSpinner size={20} />
    );
  } else if (summary.state === "notConfigured") {
    content = <NotConfiguredState />;
  } else if (summary.state === "unreachable") {
    content = <UnreachableState what={meta.findings} {...retry} />;
  } else if (summary.state === "noScanData") {
    content = <NoScanDataState producer={meta.producer} what={meta.findings} subject="this Environment" />;
  } else {
    content = (
      <>
        <NamespaceFindings summary={summary} clusterName={clusterName} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">{containersLine(summary.containers)}</span>
          <DefectDojoLink href={summary.runtime.url} label={`Product ${placeLabel(summary.place)}`} />
        </div>
      </>
    );
  }

  return (
    <Card className="mb-4 space-y-2 p-4" data-testid="environment-security-summary">
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0" aria-hidden />
        <h3 className="text-foreground text-sm font-semibold">Runtime security</h3>
      </div>
      {content}
    </Card>
  );
}
