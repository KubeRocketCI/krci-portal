import { useInfoRows } from "./hooks/useInfoRows";
import { Card } from "@/core/components/ui/card";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useTektonResultPipelineRunQuery } from "../../hooks/data";
import { InfoColumns } from "@/core/components/InfoColumns";

export const Overview = () => {
  const pipelineRunQuery = useTektonResultPipelineRunQuery();
  const gridItems = useInfoRows();

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Pipeline Run Details (from Tekton Results)</h3>
      <LoadingWrapper isLoading={pipelineRunQuery.isLoading}>
        <InfoColumns gridItems={gridItems} gridCols={4} />
      </LoadingWrapper>
    </Card>
  );
};
