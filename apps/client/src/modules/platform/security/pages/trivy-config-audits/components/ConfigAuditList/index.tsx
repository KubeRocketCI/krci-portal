import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useConfigAuditReportWatchList } from "@/k8s/api/groups/Trivy/ConfigAuditReport";
import { EmptyList } from "@/core/components/EmptyList";
import { ConfigAuditReport } from "@my-project/shared";

interface ConfigAuditListProps {
  /**
   * Namespace to filter config audit reports
   */
  namespace?: string;
}

/**
 * ConfigAuditList component displays a table of Trivy Configuration Audit reports.
 * Shows Kubernetes resource misconfigurations with severity counts.
 */
export function ConfigAuditList({ namespace }: ConfigAuditListProps) {
  const columns = useColumns();

  const configAuditReportWatchList = useConfigAuditReportWatchList({ namespace });

  return (
    <DataTable<ConfigAuditReport>
      id={TABLE.TRIVY_CONFIG_AUDIT_REPORTS_LIST.id}
      data={configAuditReportWatchList.data.array}
      columns={columns}
      isLoading={configAuditReportWatchList.isLoading}
      blockerError={configAuditReportWatchList.error ? (configAuditReportWatchList.error as Error) : undefined}
      emptyListComponent={
        <EmptyList
          customText="No configuration audit reports found"
          description="Trivy configuration audit reports will appear here once resources are scanned"
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
