import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { ConsolidatedVulnerabilityImage } from "../types";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_TRIVY_VULNERABILITY_DETAILS_FULL } from "../../trivy-vulnerability-details/route";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { Badge } from "@/core/components/ui/badge";
import { ChevronRight } from "lucide-react";

/**
 * Hook to define columns for the consolidated Trivy Vulnerability Images table.
 * Groups images by digest+namespace and shows where each image is used.
 */
export function useColumns(): TableColumn<ConsolidatedVulnerabilityImage>[] {
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
                to={PATH_TRIVY_VULNERABILITY_DETAILS_FULL}
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
        },
      },
      {
        id: "total",
        label: "Total",
        data: {
          columnSortableValuePath: "total",
          render: ({ data }) => <span className="text-sm font-medium">{data.total}</span>,
        },
        cell: {
          baseWidth: 6,
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
        },
      },
    ],
    [clusterName]
  );
}
