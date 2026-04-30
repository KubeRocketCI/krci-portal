import {
  useWatchCDPipelineByCodebaseBranch,
  useWatchCDPipelineByInputDockerStream,
  useWatchCDPipelineByStageAutotest,
} from "@/k8s/api/groups/KRCI/CDPipeline";
import { Codebase, CodebaseBranch, isApplication, isAutotest } from "@my-project/shared";

export const useDeletionConflictItem = (codebaseBranch: CodebaseBranch, codebase: Codebase) => {
  const codebaseBranchSpecName = codebaseBranch.spec.branchName;
  const codebaseBranchMetadataName = codebaseBranch.metadata.name;

  const cdPipelineByStageAutotestWatch = useWatchCDPipelineByStageAutotest(
    isAutotest(codebase) ? codebaseBranchSpecName : undefined,
    codebase.metadata.namespace
  );

  const cdPipelineByCodebaseBranchWatch = useWatchCDPipelineByCodebaseBranch(
    isApplication(codebase) ? codebaseBranchMetadataName : undefined,
    codebase.metadata.namespace
  );

  const cdPipelineByInputDockerStreamWatch = useWatchCDPipelineByInputDockerStream(
    isApplication(codebase) ? codebaseBranchMetadataName : undefined,
    codebase.metadata.namespace
  );

  return (
    cdPipelineByStageAutotestWatch.data ??
    cdPipelineByCodebaseBranchWatch.data ??
    cdPipelineByInputDockerStreamWatch.data
  );
};
