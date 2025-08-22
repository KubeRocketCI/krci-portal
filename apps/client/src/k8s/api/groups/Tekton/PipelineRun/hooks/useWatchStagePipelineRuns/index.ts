import { PipelineRun, pipelineRunLabels, pipelineType } from "@my-project/shared";
import { useQuery } from "@tanstack/react-query";
import { usePipelineRunWatchList } from "..";

export const useWatchStagePipelineRuns = (stageMetadataName: string, cdPipelineName: string, namespace: string) => {
  const pipelineRunWatchList = usePipelineRunWatchList({
    namespace,
    labels: {
      [pipelineRunLabels.stage]: stageMetadataName,
      [pipelineRunLabels.cdPipeline]: cdPipelineName,
    },
  });

  return useQuery({
    queryKey: ["stagePipelineRuns", pipelineRunWatchList.resourceVersion],
    queryFn: () => {
      return pipelineRunWatchList.dataArray.reduce<{
        all: PipelineRun[];
        deploy: PipelineRun[];
        clean: PipelineRun[];
      }>(
        (acc, cur) => {
          const curPipelineType = cur.metadata?.labels?.[pipelineRunLabels.pipelineType];

          if (!pipelineType) {
            acc.all.push(cur);
          }

          if (curPipelineType === pipelineType.deploy) {
            acc.deploy.push(cur);
          }

          if (curPipelineType === pipelineType.clean) {
            acc.clean.push(cur);
          }

          return acc;
        },
        {
          all: [],
          deploy: [],
          clean: [],
        }
      );
    },
  });
};
