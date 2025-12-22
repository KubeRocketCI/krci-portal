import { PipelineRunDiagram } from "@/modules/platform/pipelineruns/components/PipelineRunDiagram";
import { routePipelineRunDetails } from "../../route";
import { Card } from "@/core/components/ui/card";

export const Diagram = () => {
  const params = routePipelineRunDetails.useParams();

  return (
    <Card className="flex h-[var(--content-height)] w-full flex-col">
      <PipelineRunDiagram pipelineRunName={params.name} namespace={params.namespace} />
    </Card>
  );
};
