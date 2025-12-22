import { TektonResultsTable } from "@/k8s/tektonResults/components/TektonResultsTable";
import { buildPipelineFilter } from "@/k8s/tektonResults/utils/celFilters";
import { routePipelineDetails } from "../../route";

const TABLE_ID = "pipeline-details-history";

/**
 * History component for Pipeline details page
 * Shows PipelineRun history filtered by pipeline name from Tekton Results API
 */
export const History = () => {
  const { namespace, name: pipelineName } = routePipelineDetails.useParams();

  // Build CEL filter to show only PipelineRuns for this pipeline
  const filter = buildPipelineFilter(pipelineName);

  return (
    <TektonResultsTable
      namespace={namespace}
      filter={filter}
      tableId={TABLE_ID}
      hiddenColumns={["pipeline"]} // Hide pipeline column since all results are for the same pipeline
      contextName={pipelineName}
    />
  );
};
