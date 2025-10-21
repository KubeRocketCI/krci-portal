import { useWatchCDPipelineByAutotest, useWatchCDPipelineByApplicationQuery } from "@/k8s/api/groups/KRCI/CDPipeline";
import { Codebase, codebaseType } from "@my-project/shared";

export const useCodebaseDeletionConflictResourceQuery = (codebase: Codebase) => {
  const cdPipelineByAutotestWatch = useWatchCDPipelineByAutotest(
    codebase.spec.type === codebaseType.autotest ? codebase.metadata.name : undefined,
    codebase.metadata.namespace
  );

  const cdPipelineByApplicationWatchQuery = useWatchCDPipelineByApplicationQuery(
    codebase.spec.type === codebaseType.application ? codebase.metadata.name : undefined,
    codebase.metadata.namespace
  );

  if (!codebase) {
    return null;
  }

  if (cdPipelineByAutotestWatch.query.data) {
    return cdPipelineByAutotestWatch.query;
  }

  if (cdPipelineByApplicationWatchQuery.data) {
    return cdPipelineByApplicationWatchQuery;
  }
};
