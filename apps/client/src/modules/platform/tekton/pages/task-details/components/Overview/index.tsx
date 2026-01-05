import { useInfoRows } from "./hooks/useInfoRows";
import { useTaskWatch } from "../../hooks/data";
import { Card } from "@/core/components/ui/card";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { InfoColumns } from "@/core/components/InfoColumns";

export const Overview = () => {
  const taskWatch = useTaskWatch();
  const task = taskWatch.query.data;
  const gridItems = useInfoRows(task!);

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Task Details</h3>
      <LoadingWrapper isLoading={taskWatch.isLoading}>
        <InfoColumns gridItems={gridItems} gridCols={4} />
      </LoadingWrapper>
    </Card>
  );
};
