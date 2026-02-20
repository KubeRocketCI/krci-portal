import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_TRIVY_EXPOSED_SECRET_DETAILS_FULL } from "../../trivy-exposed-secret-details/route";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { Badge } from "@/core/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { ConsolidatedSecretImage } from "../types";

export function useColumns(): TableColumn<ConsolidatedSecretImage>[] {
  const { loadSettings } = useTableSettings(TABLE.TRIVY_EXPOSED_SECRET_REPORTS_LIST.id);
  const tableSettings = loadSettings();
  const { clusterName } = useParams({ strict: false });

  return useMemo(
    () => [
      {
        id: "image",
        label: "Image",
        data: {
          columnSortableValuePath: "repository",
          render: ({ data }) => {
            const imageDisplay = `${data.repository}:${data.tag}`;

            return (
              <Link
                to={PATH_TRIVY_EXPOSED_SECRET_DETAILS_FULL}
                params={{
                  namespace: data.namespace,
                  name: data.reportName,
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
          ...getSyncedColumnData(tableSettings, "image"),
        },
      },
      {
        id: "namespace",
        label: "Namespace",
        data: {
          columnSortableValuePath: "namespace",
          render: ({ data }) => <span className="text-muted-foreground text-sm">{data.namespace || "-"}</span>,
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, "namespace"),
        },
      },
      {
        id: "resources",
        label: "Resources",
        data: {
          customSortFn: (a, b) => a.resources.length - b.resources.length,
          render: ({ data }) => (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {data.resources.length} {data.resources.length === 1 ? "resource" : "resources"}
              </Badge>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </div>
          ),
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, "resources"),
        },
      },
      {
        id: "critical",
        label: "Critical",
        data: {
          columnSortableValuePath: "criticalCount",
          render: ({ data }) => <SeverityCountBadge count={data.criticalCount} severity="critical" />,
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
          columnSortableValuePath: "highCount",
          render: ({ data }) => <SeverityCountBadge count={data.highCount} severity="high" />,
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
          columnSortableValuePath: "mediumCount",
          render: ({ data }) => <SeverityCountBadge count={data.mediumCount} severity="medium" />,
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
          columnSortableValuePath: "lowCount",
          render: ({ data }) => <SeverityCountBadge count={data.lowCount} severity="low" />,
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "low"),
        },
      },
      {
        id: "totalSecrets",
        label: "Total Secrets",
        data: {
          columnSortableValuePath: "totalSecrets",
          render: ({ data }) => <span className="text-sm font-medium">{data.totalSecrets}</span>,
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "totalSecrets"),
        },
      },
      {
        id: "lastScan",
        label: "Last Scan",
        data: {
          columnSortableValuePath: "lastScan",
          render: ({ data }) => {
            if (!data.lastScan) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }
            const date = new Date(data.lastScan);
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
          ...getSyncedColumnData(tableSettings, "lastScan"),
        },
      },
    ],
    [tableSettings, clusterName]
  );
}
