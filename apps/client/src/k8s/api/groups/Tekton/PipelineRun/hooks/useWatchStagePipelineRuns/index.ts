import { PipelineRun, pipelineRunLabels, pipelineType } from "@my-project/shared";
import { useMemo } from "react";
import { usePipelineRunWatchList } from "..";

// ISO-8601 UTC timestamps are lex-sortable; string compare avoids per-call Date allocations.
const byCreationDesc = (a: PipelineRun, b: PipelineRun) =>
  (b.metadata.creationTimestamp ?? "").localeCompare(a.metadata.creationTimestamp ?? "");

export const useWatchStagePipelineRuns = (stageResourceName: string, cdPipelineName: string, namespace: string) => {
  const pipelineRunWatchList = usePipelineRunWatchList({
    namespace,
    labels: {
      [pipelineRunLabels.cdStage]: stageResourceName,
      [pipelineRunLabels.cdPipeline]: cdPipelineName,
    },
  });

  const data = useMemo(() => {
    const deploy: PipelineRun[] = [];
    const clean: PipelineRun[] = [];

    for (const run of pipelineRunWatchList.data.array) {
      const runPipelineType = run.metadata?.labels?.[pipelineRunLabels.pipelineType];

      if (runPipelineType === pipelineType.deploy) {
        deploy.push(run);
      } else if (runPipelineType === pipelineType.clean) {
        clean.push(run);
      }
    }

    deploy.sort(byCreationDesc);
    clean.sort(byCreationDesc);

    return { deploy, clean };
  }, [pipelineRunWatchList.data.array]);

  return { data };
};
