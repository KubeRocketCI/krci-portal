import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { Finding } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { CvssScore } from "../components/CvssScore";

/**
 * Format a 0-1 value as percentage
 */
function formatPercentage(value: number | undefined): string {
  return value !== undefined ? `${(value * 100).toFixed(2)}%` : "N/A";
}

/**
 * Hook to define columns for the EPSS Findings table
 */
export function useEpssColumns(): TableColumn<Finding>[] {
  return useMemo(
    () => [
      {
        id: "component",
        label: "Component",
        data: {
          columnSortableValuePath: "component.name",
          render: ({ data }) => (
            <div className="space-y-0.5">
              <div className="text-sm font-medium">{data.component.name}</div>
              {data.component.version && <div className="text-muted-foreground text-xs">v{data.component.version}</div>}
            </div>
          ),
        },
        cell: {
          baseWidth: 20,
        },
      },
      {
        id: "group",
        label: "Group",
        data: {
          columnSortableValuePath: "component.group",
          render: ({ data }) => (
            <span className="text-muted-foreground font-mono text-xs">{data.component.group || "-"}</span>
          ),
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "vulnerability",
        label: "Vulnerability",
        data: {
          columnSortableValuePath: "vulnerability.vulnId",
          render: ({ data }) => (
            <div className="font-mono text-xs">
              <span className="text-muted-foreground">{data.vulnerability.source}:</span> {data.vulnerability.vulnId}
            </div>
          ),
        },
        cell: {
          baseWidth: 18,
        },
      },
      {
        id: "cvss",
        label: "CVSS",
        data: {
          columnSortableValuePath: "vulnerability.cvssV3BaseScore",
          render: ({ data }) => (
            <CvssScore score={data.vulnerability.cvssV3BaseScore ?? data.vulnerability.cvssV2BaseScore} />
          ),
        },
        cell: {
          baseWidth: 10,
        },
      },
      {
        id: "epssScore",
        label: "EPSS Score",
        data: {
          columnSortableValuePath: "vulnerability.epssScore",
          render: ({ data }) => (
            <span className="font-mono text-sm">{formatPercentage(data.vulnerability.epssScore)}</span>
          ),
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "epssPercentile",
        label: "EPSS Percentile",
        data: {
          columnSortableValuePath: "vulnerability.epssPercentile",
          render: ({ data }) => (
            <span className="text-muted-foreground font-mono text-sm">
              {formatPercentage(data.vulnerability.epssPercentile)}
            </span>
          ),
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "suppressed",
        label: "Suppressed",
        data: {
          columnSortableValuePath: "analysis.isSuppressed",
          render: ({ data }) =>
            data.analysis.isSuppressed ? (
              <Badge variant="outline" className="text-xs">
                Yes
              </Badge>
            ) : null,
        },
        cell: {
          baseWidth: 10,
        },
      },
    ],
    []
  );
}
