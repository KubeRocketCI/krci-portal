// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { ShieldAlert } from "lucide-react";
import { CompactSeverityCounts } from "@/modules/platform/security/prototype-defectdojo/components/SeverityCounts";
import { CleanScanBadge } from "@/modules/platform/security/prototype-defectdojo/components/StateBlocks";
import { PROTOTYPE_NO_VALUE } from "@/modules/platform/security/prototype-defectdojo/constants";
import { usePipelineFindingsModel } from "../hooks/usePipelineFindingsModel";
import type { PipelineFindingsScope } from "../types";

/** No Environment needs its workloads here. */
const NO_STAGES: string[] = [];

export interface EnvironmentCardCountsProps {
  /** Scope that holds every Environment of the CDPipeline. Cards that pass the same scope share the requests. */
  pipeline: PipelineFindingsScope;
  /** Stage `spec.name` of the card. */
  stage: string;
  /** Opens the Overview tab of the Stage. */
  onOpen: () => void;
}

/**
 * Line of an Environment card on the CDPipeline Environments tab: active Runtime findings of the
 * namespace product by severity. A dash stands for "no scan data".
 */
export function EnvironmentCardCounts({ pipeline, stage, onOpen }: EnvironmentCardCountsProps) {
  const model = usePipelineFindingsModel(pipeline, { testsForStages: NO_STAGES, withInactive: false });
  const environment = model.environments.find((candidate) => candidate.scope.stage === stage);

  let content: React.ReactNode = PROTOTYPE_NO_VALUE;
  let reason = "No scan data";

  if (model.connection === "notConfigured") {
    reason = "DefectDojo is not connected";
  } else if (!environment || environment.state === "loading") {
    content = "…";
    reason = "Loading";
  } else if (environment.state === "unreachable") {
    content = <span className="text-destructive">Unreachable</span>;
    reason = "DefectDojo is unreachable";
  } else if (environment.state === "data") {
    reason = "Active Runtime findings";
    content =
      environment.productCounts?.total === 0 ? (
        <CleanScanBadge />
      ) : (
        <CompactSeverityCounts counts={environment.productCounts} />
      );
  }

  return (
    <button
      type="button"
      title={`${reason}. Open the Environment`}
      data-testid={`environment-card-counts-${stage}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen();
      }}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-1.5 rounded text-xs focus-visible:ring-2 focus-visible:outline-none"
    >
      <ShieldAlert className="size-3 shrink-0" aria-hidden />
      <span className="sr-only">Security: {reason}</span>
      {content}
    </button>
  );
}
