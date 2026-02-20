import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { ClusterVulnerabilityReport } from "@my-project/shared";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_TRIVY_CLUSTER_VULNERABILITY_DETAILS_FULL } from "../../trivy-cluster-vulnerability-details/route";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { Eye } from "lucide-react";
import { Button } from "@/core/components/ui/button";

export function useColumns(): TableColumn<ClusterVulnerabilityReport>[] {
  const { loadSettings } = useTableSettings(TABLE.TRIVY_CLUSTER_VULNERABILITY_REPORTS_LIST.id);
  const tableSettings = loadSettings();
  const { clusterName } = useParams({ strict: false });

  return useMemo(
    () => [
      {
        id: "imageName",
        label: "Image",
        data: {
          columnSortableValuePath: "report.artifact.repository",
          render: ({ data }) => {
            const repository = data.report?.artifact?.repository || "";
            const tag = data.report?.artifact?.tag || "latest";
            const imageDisplay = `${repository}:${tag}`;

            return (
              <Link
                to={PATH_TRIVY_CLUSTER_VULNERABILITY_DETAILS_FULL}
                params={{
                  name: data.metadata?.name || "",
                  clusterName: clusterName || "",
                }}
                className="text-foreground hover:text-primary hover:underline"
              >
                <span>{imageDisplay}</span>
              </Link>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 30,
          ...getSyncedColumnData(tableSettings, "imageName"),
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
        id: "unknown",
        label: "Unknown",
        data: {
          columnSortableValuePath: "report.summary.unknownCount",
          render: ({ data }) => (
            <SeverityCountBadge count={data.report?.summary?.unknownCount || 0} severity="unknown" />
          ),
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "unknown"),
        },
      },
      {
        id: "osFamily",
        label: "OS Family",
        data: {
          columnSortableValuePath: "report.os.family",
          render: ({ data }) => <span className="text-muted-foreground text-sm">{data.report?.os?.family || "-"}</span>,
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "osFamily"),
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
              to={PATH_TRIVY_CLUSTER_VULNERABILITY_DETAILS_FULL}
              params={{
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
