import { useMemo } from "react";
import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useClusterComplianceReportWatchList } from "@/k8s/api/groups/Trivy/ClusterComplianceReport";
import { EmptyList } from "@/core/components/EmptyList";
import { ConsolidatedComplianceReport, toConsolidatedComplianceReport } from "../../types";

/**
 * ComplianceReportList component displays a table of Trivy Cluster Compliance Reports.
 * Fetches cluster-scoped compliance data and displays it in a sortable, paginated table.
 */
export function ComplianceReportList() {
  const columns = useColumns();

  const complianceReportWatchList = useClusterComplianceReportWatchList();

  // Convert reports to consolidated format for table display
  const consolidatedReports: ConsolidatedComplianceReport[] = useMemo(() => {
    return complianceReportWatchList.data.array.map(toConsolidatedComplianceReport);
  }, [complianceReportWatchList.data.array]);

  return (
    <DataTable<ConsolidatedComplianceReport>
      id={TABLE.TRIVY_COMPLIANCE_REPORTS_LIST.id}
      data={consolidatedReports}
      columns={columns}
      isLoading={complianceReportWatchList.isLoading}
      blockerError={complianceReportWatchList.error ? (complianceReportWatchList.error as Error) : undefined}
      emptyListComponent={
        <EmptyList
          customText="No compliance reports found"
          description="Trivy cluster compliance reports will appear here once compliance scans are configured"
        />
      }
      sort={{
        order: "asc",
        sortBy: "title",
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
