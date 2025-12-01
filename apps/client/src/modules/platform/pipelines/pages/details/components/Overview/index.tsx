import { useInfoRows } from "./hooks/useInfoRows";
import { Card } from "@/core/components/ui/card";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineWatch } from "../../hooks/data";
import { InfoColumns } from "@/core/components/InfoColumns";

export const Overview = () => {
  const pipelineWatch = usePipelineWatch();
  const gridItems = useInfoRows();

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Pipeline Details</h3>
      <LoadingWrapper isLoading={pipelineWatch.query.isLoading}>
        <InfoColumns gridItems={gridItems} gridCols={4} />
      </LoadingWrapper>
    </Card>
  );
};
