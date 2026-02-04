import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useClusterRbacAssessmentReportWatchList } from "@/k8s/api/groups/Trivy/ClusterRbacAssessmentReport";
import { EmptyList } from "@/core/components/EmptyList";
import { ClusterRbacAssessmentReport } from "@my-project/shared";

export function ClusterRbacAssessmentList() {
  const columns = useColumns();

  const clusterRbacAssessmentReportWatchList = useClusterRbacAssessmentReportWatchList();

  return (
    <DataTable<ClusterRbacAssessmentReport>
      id={TABLE.TRIVY_CLUSTER_RBAC_ASSESSMENT_REPORTS_LIST.id}
      data={clusterRbacAssessmentReportWatchList.data.array}
      columns={columns}
      isLoading={clusterRbacAssessmentReportWatchList.isLoading}
      blockerError={
        clusterRbacAssessmentReportWatchList.error ? (clusterRbacAssessmentReportWatchList.error as Error) : undefined
      }
      emptyListComponent={
        <EmptyList
          customText="No cluster RBAC assessment reports found"
          description="Trivy cluster RBAC assessment reports will appear here once ClusterRoles are scanned"
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
