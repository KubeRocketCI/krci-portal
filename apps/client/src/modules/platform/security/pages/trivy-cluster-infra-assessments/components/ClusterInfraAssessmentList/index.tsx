import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useClusterInfraAssessmentReportWatchList } from "@/k8s/api/groups/Trivy/ClusterInfraAssessmentReport";
import { EmptyList } from "@/core/components/EmptyList";
import { ClusterInfraAssessmentReport } from "@my-project/shared";

export function ClusterInfraAssessmentList() {
  const columns = useColumns();

  const clusterInfraAssessmentReportWatchList = useClusterInfraAssessmentReportWatchList();

  return (
    <DataTable<ClusterInfraAssessmentReport>
      id={TABLE.TRIVY_CLUSTER_INFRA_ASSESSMENT_REPORTS_LIST.id}
      data={clusterInfraAssessmentReportWatchList.data.array}
      columns={columns}
      isLoading={clusterInfraAssessmentReportWatchList.isLoading}
      blockerError={
        clusterInfraAssessmentReportWatchList.error ? (clusterInfraAssessmentReportWatchList.error as Error) : undefined
      }
      emptyListComponent={
        <EmptyList
          customText="No cluster infrastructure assessment reports found"
          description="Trivy cluster infrastructure assessment reports will appear here once cluster resources are scanned"
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
