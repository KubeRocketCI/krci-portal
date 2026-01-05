import CodeEditor from "@/core/components/CodeEditor";
import { usePipelineWatch } from "../../hooks/data";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export const ViewPipeline = () => {
  const pipelineWatch = usePipelineWatch();
  const pipeline = pipelineWatch.query.data;

  return (
    <LoadingWrapper isLoading={pipelineWatch.isLoading}>
      <CodeEditor content={pipeline!} />
    </LoadingWrapper>
  );
};
