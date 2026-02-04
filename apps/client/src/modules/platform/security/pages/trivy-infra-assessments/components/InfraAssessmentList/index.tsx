import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useInfraAssessmentReportWatchList } from "@/k8s/api/groups/Trivy/InfraAssessmentReport";
import { EmptyList } from "@/core/components/EmptyList";
import { InfraAssessmentReport } from "@my-project/shared";

interface InfraAssessmentListProps {
  /**
   * Namespace to filter infrastructure assessment reports
   */
  namespace?: string;
}

/**
 * InfraAssessmentList component displays a table of Trivy Infrastructure Assessment reports.
 * Shows infrastructure security checks with severity counts.
 */
export function InfraAssessmentList({ namespace }: InfraAssessmentListProps) {
  const columns = useColumns();

  const infraAssessmentReportWatchList = useInfraAssessmentReportWatchList({ namespace });

  return (
    <DataTable<InfraAssessmentReport>
      id={TABLE.TRIVY_INFRA_ASSESSMENT_REPORTS_LIST.id}
      data={infraAssessmentReportWatchList.data.array}
      columns={columns}
      isLoading={infraAssessmentReportWatchList.isLoading}
      blockerError={infraAssessmentReportWatchList.error ? (infraAssessmentReportWatchList.error as Error) : undefined}
      emptyListComponent={
        <EmptyList
          customText="No infrastructure assessment reports found"
          description="Trivy infrastructure assessment reports will appear here once resources are scanned"
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
