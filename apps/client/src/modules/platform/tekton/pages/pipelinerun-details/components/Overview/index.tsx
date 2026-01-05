import { useInfoRows } from "./hooks/useInfoRows";
import { Card } from "@/core/components/ui/card";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineRunWatchWithPageParams } from "../../hooks/data";
import { InfoColumns } from "@/core/components/InfoColumns";

export const Overview = () => {
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const gridItems = useInfoRows();

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Pipeline Run Details</h3>
      <LoadingWrapper isLoading={pipelineRunWatch.isLoading}>
        <InfoColumns gridItems={gridItems} gridCols={4} />
      </LoadingWrapper>
    </Card>
  );
};
