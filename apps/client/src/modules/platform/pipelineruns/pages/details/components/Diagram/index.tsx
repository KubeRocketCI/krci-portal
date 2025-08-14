import { PipelineRunDiagram } from "@/modules/platform/pipelineruns/components/PipelineRunDiagram";
import { routePipelineRunDetails } from "../../route";

export const Diagram = () => {
  const params = routePipelineRunDetails.useParams();

  return <PipelineRunDiagram pipelineRunName={params.name} namespace={params.namespace} />;
};
