import { TabSection } from "@/core/components/TabSection";
import { useInfoColumns } from "./hooks/useInfoColumns";
import { useStageWatch } from "../../../../hooks";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Card } from "@/core/components/ui/card";
import { InfoColumns } from "@/core/components/InfoColumns";

export const Overview = () => {
  const gridItems = useInfoColumns();
  const stageWatch = useStageWatch();


  return (
    <TabSection title="Overview">
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-xl font-semibold">Stage Details</h3>
        <LoadingWrapper isLoading={stageWatch.query.isFetching}>
          <InfoColumns gridItems={gridItems} gridCols={4} />
        </LoadingWrapper>
      </Card>
    </TabSection>
  );
};
