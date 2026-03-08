import { Card } from "@/core/components/ui/card";
import { Pipelines } from "./components/Pipelines";

export const PipelineList = () => {
  return (
    <Card className="p-6" data-tour="pipelines-table">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Pipeline Runs</h3>
      <div data-tour="pipeline-history">
        <Pipelines />
      </div>
    </Card>
  );
};
