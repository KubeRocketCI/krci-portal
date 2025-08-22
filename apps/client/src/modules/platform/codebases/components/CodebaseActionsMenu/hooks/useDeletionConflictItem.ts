import { useWatchCDPipelineByAutotest, useWatchCDPipelineByApplication } from "@/k8s/api/groups/KRCI/CDPipeline";
import { Codebase, codebaseType } from "@my-project/shared";

export const useDeletionConflictItem = (codebase: Codebase) => {
  const cdPipelineByAutotestWatch = useWatchCDPipelineByAutotest(
    codebase.spec.type === codebaseType.autotest ? codebase.metadata.name : undefined,
    codebase.metadata.namespace
  );

  const cdPipelineByApplicationWatch = useWatchCDPipelineByApplication(
    codebase.spec.type === codebaseType.application ? codebase.metadata.name : undefined,
    codebase.metadata.namespace
  );

  if (!codebase) {
    return null;
  }

  if (cdPipelineByAutotestWatch.data) {
    return cdPipelineByAutotestWatch.data;
  }

  if (cdPipelineByApplicationWatch) {
    return cdPipelineByApplicationWatch;
  }
};
