import { TektonResultsTable } from "@/k8s/tektonResults/components/TektonResultsTable";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

const TABLE_ID = "pipelineruns-tekton-results-history";

/**
 * TektonResultsHistory component for PipelineRuns list page
 * Shows all PipelineRun history from Tekton Results API
 */
export const TektonResultsHistory = () => {
  const { namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  return <TektonResultsTable namespace={namespace} tableId={TABLE_ID} />;
};
