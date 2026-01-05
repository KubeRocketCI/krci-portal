import { PipelineDiagram } from "@/modules/platform/tekton/components/PipelineDiagram";
import { routePipelineDetails } from "../../route";
import { Card } from "@/core/components/ui/card";

export const Diagram = () => {
  const params = routePipelineDetails.useParams();

  return (
    <Card className="flex h-full w-full flex-col">
      <PipelineDiagram pipelineName={params.name} namespace={params.namespace} />
    </Card>
  );
};
