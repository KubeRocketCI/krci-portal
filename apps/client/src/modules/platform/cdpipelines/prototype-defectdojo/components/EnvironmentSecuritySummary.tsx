// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { PATH_TRIVY_VULNERABILITIES_FULL } from "@/modules/platform/security/pages/trivy-vulnerabilities/route";
import { DefectDojoLink } from "@/modules/platform/security/prototype-defectdojo/components/DefectDojoLink";
import { SeverityCounts } from "@/modules/platform/security/prototype-defectdojo/components/SeverityCounts";
import {
  CleanScanBadge,
  NoScanDataState,
  UnreachableState,
} from "@/modules/platform/security/prototype-defectdojo/components/StateBlocks";
import { usePipelineFindingsModel } from "../hooks/usePipelineFindingsModel";
import type { PipelineFindingsScope } from "../types";

export interface EnvironmentSecuritySummaryProps {
  /** Scope that holds the Environment. */
  pipeline: PipelineFindingsScope;
  /** Stage `spec.name` of the Environment. */
  stage: string;
}

/**
 * Compact summary of the namespace product of an Environment for the Stage Overview tab: active
 * findings by severity, scanned workload containers and how many of them belong to no codebase.
 * Links to the Vulnerabilities list of the Security section, filtered to the cluster and namespace.
 */
export function EnvironmentSecuritySummary({ pipeline, stage }: EnvironmentSecuritySummaryProps) {
  const model = usePipelineFindingsModel(pipeline, { testsForStages: [stage], withInactive: false });
  const environment = model.environments.find((candidate) => candidate.scope.stage === stage);

  const workloads = environment?.workloads ?? [];
  const running = workloads.filter((workload) => !workload.notRunning);
  const withoutCodebase = running.filter((workload) => workload.codebaseName === null).length;
  const notRunning = workloads.length - running.length;

  return (
    <Card className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4" data-testid="environment-security-summary">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-red-100 dark:bg-red-950">
          <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
        </div>
        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Runtime security</div>
      </div>

      {model.connection === "notConfigured" && (
        <span className="text-muted-foreground text-sm">
          DefectDojo is not connected. The portal server has no DefectDojo URL or token.
        </span>
      )}
      {model.connection !== "notConfigured" && (!environment || environment.state === "loading") && (
        <LoadingSpinner size={20} />
      )}
      {model.connection !== "notConfigured" && environment?.state === "unreachable" && (
        <div className="min-w-0 flex-1">
          <UnreachableState what="Runtime findings" onRetry={model.retry} />
        </div>
      )}
      {model.connection !== "notConfigured" && environment?.state === "noData" && (
        <NoScanDataState level="runtime" subject="this Environment" className="flex-1 border-0 p-0" />
      )}

      {model.connection !== "notConfigured" && environment?.state === "data" && (
        <>
          {environment.productCounts?.total === 0 ? (
            <CleanScanBadge />
          ) : (
            <SeverityCounts counts={environment.productCounts} />
          )}
          <span className="text-foreground text-sm">
            {running.length} workload containers scanned
            <span className="text-muted-foreground">
              , {withoutCodebase} without a codebase
              {notRunning > 0 && `, ${notRunning} not running`}
            </span>
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link
              to={PATH_TRIVY_VULNERABILITIES_FULL}
              params={{ clusterName: pipeline.portalClusterName }}
              search={{ variant: "A", clusters: environment.scope.clusterName, namespace: environment.scope.namespace }}
              className="text-secondary-dark hover:text-primary focus-visible:ring-ring rounded text-xs underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              Findings of this namespace
            </Link>
            {environment.product && (
              <DefectDojoLink href={environment.product.url} label={`Product ${environment.product.name}`}>
                DefectDojo
              </DefectDojoLink>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
