import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { ConsolidatedComplianceReport, getComplianceTypeBadgeClasses, getPassRateColorClass } from "../types";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_TRIVY_COMPLIANCE_DETAILS_FULL } from "../../trivy-compliance-details/route";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/core/utils/classname";
import { ChevronRight } from "lucide-react";

/**
 * Hook to define columns for the Cluster Compliance Reports table.
 */
export function useColumns(): TableColumn<ConsolidatedComplianceReport>[] {
  const { loadSettings } = useTableSettings(TABLE.TRIVY_COMPLIANCE_REPORTS_LIST.id);
  const tableSettings = loadSettings();
  const { clusterName } = useParams({ strict: false });

  return useMemo(
    () => [
      {
        id: "title",
        label: "Title",
        data: {
          columnSortableValuePath: "title",
          render: ({ data }) => {
            return (
              <Link
                to={PATH_TRIVY_COMPLIANCE_DETAILS_FULL}
                params={{
                  reportName: data.name,
                  clusterName: clusterName || "",
                }}
                className="text-foreground hover:text-primary hover:underline"
              >
                <span>{data.title}</span>
              </Link>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 35,
          ...getSyncedColumnData(tableSettings, "title"),
        },
      },
      {
        id: "type",
        label: "Type",
        data: {
          columnSortableValuePath: "type",
          render: ({ data }) => (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium uppercase",
                getComplianceTypeBadgeClasses(data.type)
              )}
            >
              {data.type}
            </span>
          ),
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "type"),
        },
      },
      {
        id: "version",
        label: "Version",
        data: {
          columnSortableValuePath: "version",
          render: ({ data }) => <span className="text-muted-foreground text-sm">{data.version || "-"}</span>,
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "version"),
        },
      },
      {
        id: "passCount",
        label: "Pass",
        data: {
          columnSortableValuePath: "passCount",
          render: ({ data }) => (
            <span className="text-sm font-medium text-green-600 dark:text-green-400">{data.passCount}</span>
          ),
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "passCount"),
        },
      },
      {
        id: "failCount",
        label: "Fail",
        data: {
          columnSortableValuePath: "failCount",
          render: ({ data }) => {
            const colorClass =
              data.failCount === null || data.failCount === 0
                ? "text-muted-foreground"
                : "text-red-600 dark:text-red-400";

            return <span className={cn("text-sm font-medium", colorClass)}>{data.failCount ?? "-"}</span>;
          },
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "failCount"),
        },
      },
      {
        id: "passRate",
        label: "Pass Rate",
        data: {
          columnSortableValuePath: "passRate",
          render: ({ data }) => (
            <span className={cn("text-sm font-medium", getPassRateColorClass(data.passRate))}>{data.passRate}%</span>
          ),
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "passRate"),
        },
      },
      {
        id: "actions",
        label: "",
        data: {
          render: ({ data }) => (
            <Link
              to={PATH_TRIVY_COMPLIANCE_DETAILS_FULL}
              params={{
                reportName: data.name,
                clusterName: clusterName || "",
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Badge variant="outline" className="gap-1">
                View Details
                <ChevronRight className="h-3 w-3" />
              </Badge>
            </Link>
          ),
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, "actions"),
        },
      },
    ],
    [tableSettings, clusterName]
  );
}
