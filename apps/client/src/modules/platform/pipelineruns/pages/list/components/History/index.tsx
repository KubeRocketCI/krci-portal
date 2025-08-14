import { Table } from "@/core/components/Table";
import { useAllPipelineRunLogsQuery } from "@/k8s/krakend/hooks/usePipelineRunLogs";
import { routePipelineRunList } from "../../route";
import { useShallow } from "zustand/react/shallow";
import { useClusterStore } from "@/k8s/store";
import { useColumns } from "./hooks/useColumns";

export const History = () => {
  const params = routePipelineRunList.useParams();

  const { namespace: defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );

  const logsQuery = useAllPipelineRunLogsQuery(params.clusterName, defaultNamespace);
  const columns = useColumns();

  return (
    <Table
      id={"pipeline-run-history-of-pipeline"}
      isLoading={logsQuery.isLoading}
      data={logsQuery.data! || []}
      blockerError={logsQuery.error}
      columns={columns}
      settings={{
        show: false,
      }}
    />
  );
};
