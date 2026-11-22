// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { Link } from "@tanstack/react-router";
import { Badge } from "@/core/components/ui/badge";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { CompactSeverityCounts } from "@/modules/platform/security/prototype-defectdojo/components/SeverityCounts";
import { CleanScanBadge } from "@/modules/platform/security/prototype-defectdojo/components/StateBlocks";
import { PROTOTYPE_NO_VALUE } from "@/modules/platform/security/prototype-defectdojo/constants";
import { usePipelineFindingsModel } from "../hooks/usePipelineFindingsModel";
import { testCounts, workloadTest } from "../model";
import type { PipelineFindingsModel, PipelineFindingsScope, RuntimeWorkload } from "../types";

export interface ApplicationSecurityCellProps {
  /** Scope that holds the Environment of the table. */
  pipeline: PipelineFindingsScope;
  /** Stage `spec.name` of the Environment. */
  stage: string;
  /** Codebase of the application row. */
  codebaseName: string;
}

function Dash({ reason }: { reason: string }) {
  return (
    <span className="text-muted-foreground text-sm" title={reason} aria-label={reason}>
      {PROTOTYPE_NO_VALUE}
    </span>
  );
}

/**
 * "Security" cell of an application row of the Stage Applications table: Runtime findings of the
 * workload containers of the codebase in the Environment. One combined cell; counts are per report
 * kind. The cell links to the Security Findings tab of the codebase with the Environment in focus.
 */
export function ApplicationSecurityCell({ pipeline, stage, codebaseName }: ApplicationSecurityCellProps) {
  const model = usePipelineFindingsModel(pipeline, { testsForStages: [stage], withInactive: false });
  const environment = model.environments.find((candidate) => candidate.scope.stage === stage);

  if (model.connection === "notConfigured") {
    return <Dash reason="DefectDojo is not connected" />;
  }
  if (!environment || environment.state === "loading") {
    return <LoadingSpinner size={16} />;
  }
  if (environment.state === "unreachable") {
    return <span className="text-destructive text-xs">DefectDojo is unreachable</span>;
  }

  const workloads = (environment.workloads ?? []).filter((workload) => workload.codebaseName === codebaseName);
  if (environment.state === "noData" || workloads.length === 0) {
    return <Dash reason="No scan data" />;
  }

  const running = workloads.filter((workload) => !workload.notRunning);

  return (
    <Link
      to={PATH_PROJECT_DETAILS_FULL}
      params={{ clusterName: pipeline.portalClusterName, namespace: pipeline.namespace, name: codebaseName }}
      search={{ tab: "findings", cdPipeline: pipeline.cdPipeline, stage }}
      title={`Security findings of ${codebaseName} in this Environment`}
      data-testid={`application-security-${codebaseName}`}
      className="hover:bg-input/50 focus-visible:ring-ring inline-flex flex-col items-start gap-1 rounded px-1 py-0.5 focus-visible:ring-2 focus-visible:outline-none"
    >
      {running.length === 0 && <Badge variant="neutral">Not running</Badge>}
      {running.map((workload) => (
        <WorkloadCounts key={workload.key} workload={workload} model={model} showContainer={running.length > 1} />
      ))}
    </Link>
  );
}

interface WorkloadCountsProps {
  workload: RuntimeWorkload;
  model: PipelineFindingsModel;
  /** Names the container; set when the codebase runs several. */
  showContainer: boolean;
}

function WorkloadCounts({ workload, model, showContainer }: WorkloadCountsProps) {
  const vulnerabilityTest = workloadTest(workload, "VulnerabilityReport");
  const secretTest = workloadTest(workload, "ExposedSecretReport");
  const vulnerabilities = testCounts(model.counts, vulnerabilityTest);
  const secrets = testCounts(model.counts, secretTest);

  const vulnerabilitiesClean = vulnerabilityTest !== null && vulnerabilities?.total === 0;
  const secretsClean = secretTest !== null && secrets?.total === 0;

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {showContainer && <span className="text-muted-foreground text-xs">{workload.container}</span>}
      {vulnerabilitiesClean && secretsClean ? (
        <CleanScanBadge />
      ) : (
        <>
          <span aria-label="Vulnerabilities" title="Vulnerabilities" className="inline-flex items-center">
            {vulnerabilitiesClean ? (
              <span className="text-muted-foreground text-xs">No vulnerabilities</span>
            ) : (
              <CompactSeverityCounts counts={vulnerabilityTest ? vulnerabilities : null} />
            )}
          </span>
          {secrets !== null && secrets.total > 0 && (
            <span className="text-destructive text-xs font-semibold">{secrets.total} secrets</span>
          )}
          {secretsClean && <span className="text-muted-foreground text-xs">No secrets</span>}
        </>
      )}
    </span>
  );
}
