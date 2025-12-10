import { PipelineRunDiagram } from "@/modules/platform/pipelineruns/components/PipelineRunDiagram";
import { routePipelineRunDetails } from "../../route";
import { Card } from "@/core/components/ui/card";

export const Diagram = () => {
  const params = routePipelineRunDetails.useParams();

  console.log(params);
  console.log("DIAGRAMs");

  return (
    <Card className="min-h-4xl h-4xl w-4xlbg-primary min-w-4xl">
      <PipelineRunDiagram pipelineRunName={params.name} namespace={params.namespace} />
    </Card>
  );
};
