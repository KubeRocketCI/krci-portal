import { TektonResultsTable } from "@/modules/platform/tekton/components/TektonResultsTable";
import { buildCodebaseFilter } from "@/modules/platform/tekton/utils/celFilters";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routeProjectDetails } from "../../../../route";

const TABLE_ID = "codebase-pipelineruns-tekton-results-history";

export const TektonResultsHistory = () => {
  const params = routeProjectDetails.useParams();
  const { namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  const codebaseName = params.name;
  const filter = buildCodebaseFilter(codebaseName);

  return (
    <TektonResultsTable
      namespace={namespace}
      tableId={TABLE_ID}
      filter={filter}
      contextName={codebaseName}
      filterControls={["status", "pipelineType", "codebaseBranches"]}
    />
  );
};
