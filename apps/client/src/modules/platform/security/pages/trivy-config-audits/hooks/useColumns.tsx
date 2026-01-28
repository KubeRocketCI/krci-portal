import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { ConfigAuditReport, configAuditReportLabels } from "@my-project/shared";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_TRIVY_CONFIG_AUDIT_DETAILS_FULL } from "../../trivy-config-audit-details/route";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { Badge } from "@/core/components/ui/badge";
import { Eye } from "lucide-react";
import { Button } from "@/core/components/ui/button";

/**
 * Hook to define columns for the Config Audit Reports table.
 */
export function useColumns(): TableColumn<ConfigAuditReport>[] {
  const { loadSettings } = useTableSettings(TABLE.TRIVY_CONFIG_AUDIT_REPORTS_LIST.id);
  const tableSettings = loadSettings();
  const { clusterName } = useParams({ strict: false });

  return useMemo(
    () => [
      {
        id: "resourceName",
        label: "Resource Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({ data }) => {
            const resourceName =
              data.metadata?.labels?.[configAuditReportLabels.resourceName] || data.metadata?.name || "-";

            return (
              <Link
                to={PATH_TRIVY_CONFIG_AUDIT_DETAILS_FULL}
                params={{
                  namespace: data.metadata?.namespace || "",
                  name: data.metadata?.name || "",
                  clusterName: clusterName || "",
                }}
                className="text-foreground hover:text-primary hover:underline"
              >
                <span className="font-medium">{resourceName}</span>
              </Link>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 25,
          ...getSyncedColumnData(tableSettings, "resourceName"),
        },
      },
      {
        id: "resourceKind",
        label: "Resource Kind",
        data: {
          columnSortableValuePath: `metadata.labels.${configAuditReportLabels.resourceKind}`,
          render: ({ data }) => {
            const resourceKind = data.metadata?.labels?.[configAuditReportLabels.resourceKind] || "-";
            return (
              <Badge variant="outline" className="text-xs">
                {resourceKind}
              </Badge>
            );
          },
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, "resourceKind"),
        },
      },
      {
        id: "critical",
        label: "Critical",
        data: {
          columnSortableValuePath: "report.summary.criticalCount",
          render: ({ data }) => (
            <SeverityCountBadge count={data.report?.summary?.criticalCount || 0} severity="critical" />
          ),
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "critical"),
        },
      },
      {
        id: "high",
        label: "High",
        data: {
          columnSortableValuePath: "report.summary.highCount",
          render: ({ data }) => <SeverityCountBadge count={data.report?.summary?.highCount || 0} severity="high" />,
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "high"),
        },
      },
      {
        id: "medium",
        label: "Medium",
        data: {
          columnSortableValuePath: "report.summary.mediumCount",
          render: ({ data }) => <SeverityCountBadge count={data.report?.summary?.mediumCount || 0} severity="medium" />,
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "medium"),
        },
      },
      {
        id: "low",
        label: "Low",
        data: {
          columnSortableValuePath: "report.summary.lowCount",
          render: ({ data }) => <SeverityCountBadge count={data.report?.summary?.lowCount || 0} severity="low" />,
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "low"),
        },
      },
      {
        id: "totalChecks",
        label: "Total Checks",
        data: {
          customSortFn: (a, b) => {
            const totalA = a.report?.checks?.length || 0;
            const totalB = b.report?.checks?.length || 0;
            return totalA - totalB;
          },
          render: ({ data }) => {
            const total = data.report?.checks?.length || 0;
            return <span className="text-sm font-medium">{total}</span>;
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "totalChecks"),
        },
      },
      {
        id: "lastUpdated",
        label: "Last Updated",
        data: {
          columnSortableValuePath: "report.updateTimestamp",
          render: ({ data }) => {
            if (!data.report?.updateTimestamp) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }
            const date = new Date(data.report.updateTimestamp);
            return (
              <span className="text-sm">
                {date.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </span>
            );
          },
        },
        cell: {
          baseWidth: 14,
          ...getSyncedColumnData(tableSettings, "lastUpdated"),
        },
      },
      {
        id: "actions",
        label: "",
        data: {
          render: ({ data }) => (
            <Link
              to={PATH_TRIVY_CONFIG_AUDIT_DETAILS_FULL}
              params={{
                namespace: data.metadata?.namespace || "",
                name: data.metadata?.name || "",
                clusterName: clusterName || "",
              }}
            >
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
                <span className="sr-only">View details</span>
              </Button>
            </Link>
          ),
        },
        cell: {
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, "actions"),
        },
      },
    ],
    [tableSettings, clusterName]
  );
}
