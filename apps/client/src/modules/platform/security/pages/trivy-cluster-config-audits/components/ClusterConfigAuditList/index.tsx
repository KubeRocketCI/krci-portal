import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useClusterConfigAuditReportWatchList } from "@/k8s/api/groups/Trivy/ClusterConfigAuditReport";
import { EmptyList } from "@/core/components/EmptyList";
import { ClusterConfigAuditReport } from "@my-project/shared";

export function ClusterConfigAuditList() {
  const columns = useColumns();

  const clusterConfigAuditReportWatchList = useClusterConfigAuditReportWatchList();

  return (
    <DataTable<ClusterConfigAuditReport>
      id={TABLE.TRIVY_CLUSTER_CONFIG_AUDIT_REPORTS_LIST.id}
      data={clusterConfigAuditReportWatchList.data.array}
      columns={columns}
      isLoading={clusterConfigAuditReportWatchList.isLoading}
      blockerError={
        clusterConfigAuditReportWatchList.error ? (clusterConfigAuditReportWatchList.error as Error) : undefined
      }
      emptyListComponent={
        <EmptyList
          customText="No cluster configuration audit reports found"
          description="Trivy cluster configuration audit reports will appear here once cluster resources are scanned"
        />
      }
      sort={{
        order: "desc",
        sortBy: "critical",
      }}
      pagination={{
        show: true,
      }}
      settings={{
        show: true,
      }}
    />
  );
}
