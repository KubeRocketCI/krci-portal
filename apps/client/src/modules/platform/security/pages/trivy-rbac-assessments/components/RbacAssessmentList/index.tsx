import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useRbacAssessmentReportWatchList } from "@/k8s/api/groups/Trivy/RbacAssessmentReport";
import { EmptyList } from "@/core/components/EmptyList";
import { RbacAssessmentReport } from "@my-project/shared";

interface RbacAssessmentListProps {
  namespace?: string;
}

export function RbacAssessmentList({ namespace }: RbacAssessmentListProps) {
  const columns = useColumns();

  const rbacAssessmentReportWatchList = useRbacAssessmentReportWatchList({ namespace });

  return (
    <DataTable<RbacAssessmentReport>
      id={TABLE.TRIVY_RBAC_ASSESSMENT_REPORTS_LIST.id}
      data={rbacAssessmentReportWatchList.data.array}
      columns={columns}
      isLoading={rbacAssessmentReportWatchList.isLoading}
      blockerError={rbacAssessmentReportWatchList.error ? (rbacAssessmentReportWatchList.error as Error) : undefined}
      emptyListComponent={
        <EmptyList
          customText="No RBAC assessment reports found"
          description="Trivy RBAC assessment reports will appear here once Roles and RoleBindings are scanned"
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
