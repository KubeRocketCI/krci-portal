import CodeEditor from "@/core/components/CodeEditor";
import { usePipelineRunWatchWithPageParams } from "../../hooks/data";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Card } from "@/core/components/ui/card";

export const ViewPipelineRun = () => {
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const pipelineRun = pipelineRunWatch.query.data;

  return (
    <LoadingWrapper isLoading={pipelineRunWatch.isLoading}>
      <Card>
        <CodeEditor content={pipelineRun!} />
      </Card>
    </LoadingWrapper>
  );
};
