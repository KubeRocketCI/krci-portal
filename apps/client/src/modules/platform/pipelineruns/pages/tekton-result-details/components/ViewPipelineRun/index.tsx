import CodeEditor from "@/core/components/CodeEditor";
import { useTektonResultPipelineRunQuery } from "../../hooks/data";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Card } from "@/core/components/ui/card";

export const ViewPipelineRun = () => {
  const pipelineRunQuery = useTektonResultPipelineRunQuery();
  const pipelineRun = pipelineRunQuery.data?.pipelineRun;

  return (
    <LoadingWrapper isLoading={pipelineRunQuery.isLoading}>
      {pipelineRun && (
        <Card>
          <CodeEditor content={pipelineRun} />
        </Card>
      )}
    </LoadingWrapper>
  );
};
