import { TektonResultsTable } from "@/modules/platform/tekton/components/TektonResultsTable";
import { buildStageFilter } from "@/modules/platform/tekton/utils/celFilters";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routeStageDetails } from "../../../../../../route";

const TABLE_ID = "stage-pipelineruns-tekton-results-history";

export const TektonResultsHistory = () => {
  const params = routeStageDetails.useParams();
  const { namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  const stageLabel = `${params.cdPipeline}-${params.stage}`;
  const filter = buildStageFilter(stageLabel);

  return <TektonResultsTable namespace={namespace} tableId={TABLE_ID} filter={filter} contextName={stageLabel} />;
};
