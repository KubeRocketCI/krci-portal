import CodeEditor from "@/core/components/CodeEditor";
import { usePipelineRunWatchWithPageParams } from "../../hooks/data";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export const ViewPipelineRun = () => {
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const pipelineRun = pipelineRunWatch.query.data;

  return (
    <LoadingWrapper isLoading={pipelineRunWatch.isInitialLoading}>
      <CodeEditor content={pipelineRun!} />
    </LoadingWrapper>
  );
};
