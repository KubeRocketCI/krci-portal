import { Card } from "@/core/components/ui/card";
import { Pipelines } from "./components/Pipelines";

export const StagePipelineRuns = () => {
  return (
    <Card className="p-6" data-tour="stage-pipelines">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Pipeline Runs</h3>
      <Pipelines />
    </Card>
  );
};
