import {
  useWatchCDPipelineByCodebaseBranch,
  useWatchCDPipelineByStageAutotest,
} from "@/core/k8s/api/groups/KRCI/CDPipeline";
import { Codebase, CodebaseBranch, isAutotest, isLibrary } from "@my-project/shared";

export const useDeletionConflictItem = (codebaseBranch: CodebaseBranch, codebase: Codebase) => {
  const codebaseBranchSpecName = codebaseBranch.spec.branchName;
  const codebaseBranchMetadataName = codebaseBranch.metadata.name;

  const cdPipelineByStageAutotestWatch = useWatchCDPipelineByStageAutotest(
    isAutotest(codebase) ? codebaseBranchSpecName : undefined,
    codebase.metadata.namespace
  );

  const cdPipelineByCodebaseBranchWatch = useWatchCDPipelineByCodebaseBranch(
    !isLibrary(codebase) && !isAutotest(codebase) ? codebaseBranchMetadataName : undefined,
    codebase.metadata.namespace
  );

  if (cdPipelineByStageAutotestWatch.data) {
    return cdPipelineByStageAutotestWatch.data;
  }

  if (cdPipelineByCodebaseBranchWatch.data) {
    return cdPipelineByCodebaseBranchWatch.data;
  }
};
