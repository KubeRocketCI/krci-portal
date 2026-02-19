import { TektonResultsTable } from "@/modules/platform/tekton/components/TektonResultsTable";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

const TABLE_ID = "pipelineruns-tekton-results-history";

export const TektonResultsHistory = () => {
  const { namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  return (
    <TektonResultsTable namespace={namespace} tableId={TABLE_ID} filter="data_type == 'tekton.dev/v1.PipelineRun'" />
  );
};
