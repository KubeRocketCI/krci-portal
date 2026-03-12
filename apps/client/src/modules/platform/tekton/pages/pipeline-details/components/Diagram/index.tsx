import { PipelineDiagram } from "@/modules/platform/tekton/components/PipelineDiagram";
import { routePipelineDetails } from "../../route";

export const Diagram = () => {
  const params = routePipelineDetails.useParams();

  return <PipelineDiagram pipelineName={params.name} namespace={params.namespace} />;
};
