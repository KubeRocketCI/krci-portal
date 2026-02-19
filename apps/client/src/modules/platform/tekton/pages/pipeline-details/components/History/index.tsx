import { TektonResultsTable } from "@/modules/platform/tekton/components/TektonResultsTable";
import { buildPipelineFilter } from "@/modules/platform/tekton/utils/celFilters";
import { routePipelineDetails } from "../../route";

const TABLE_ID = "pipeline-details-history";

export const History = () => {
  const { namespace, name: pipelineName } = routePipelineDetails.useParams();
  const filter = buildPipelineFilter(pipelineName);

  return (
    <TektonResultsTable
      namespace={namespace}
      filter={filter}
      tableId={TABLE_ID}
      hiddenColumns={["pipeline"]}
      contextName={pipelineName}
    />
  );
};
