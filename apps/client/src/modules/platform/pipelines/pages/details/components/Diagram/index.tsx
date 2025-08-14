import { PipelineDiagram } from "@/modules/platform/pipelines/components/PipelineDiagram";
import { routePipelineDetails } from "../../route";

export const Diagram = () => {
  const params = routePipelineDetails.useParams();

  return <PipelineDiagram pipelineName={params.name} namespace={params.namespace} />;
};
