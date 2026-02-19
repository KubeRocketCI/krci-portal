import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { ProjectsListData } from "../types";
import { Badge } from "@/core/components/ui/badge";
import { VulnerabilityProgressBar } from "../../sca/components/shared/VulnerabilityProgressBar";
import { PolicyViolationProgressBar } from "../components/PolicyViolationProgressBar";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_SCA_PROJECT_DETAILS_FULL } from "../../sca-project-details/route";

/**
 * Hook to define columns for the SCA Projects table
 * Includes column settings persistence via localStorage
 */
export const useColumns = (): TableColumn<ProjectsListData>[] => {
  const { loadSettings } = useTableSettings(TABLE.SCA_PROJECTS_LIST.id);
  const tableSettings = loadSettings();
  const { namespace, clusterName } = useParams({ strict: false });

  return useMemo(
    () => [
      {
        id: "name",
        label: "Project Name",
        data: {
          columnSortableValuePath: "name",
          render: ({ data }) => (
            <Link
              to={PATH_SCA_PROJECT_DETAILS_FULL}
              params={{ namespace: namespace || "", clusterName: clusterName || "", projectUuid: data.uuid }}
              className="text-foreground hover:text-primary font-medium hover:underline"
            >
              {data.name}
            </Link>
          ),
        },
        cell: {
          isFixed: true, // Name column is always visible
          baseWidth: 22,
          ...getSyncedColumnData(tableSettings, "name"),
        },
      },
      {
        id: "version",
        label: "Version",
        data: {
          columnSortableValuePath: "version",
          render: ({ data }) => <div className="text-muted-foreground text-sm">{data.version}</div>,
        },
        cell: {
          baseWidth: 19,
          ...getSyncedColumnData(tableSettings, "version"),
        },
      },
      {
        id: "latest",
        label: "Latest",
        data: {
          columnSortableValuePath: "isLatest",
          render: ({ data }) => (data.isLatest ? <Badge variant="success">Latest</Badge> : null),
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "latest"),
        },
      },
      {
        id: "classifier",
        label: "Classifier",
        data: {
          columnSortableValuePath: "classifier",
          render: ({ data }) => <Badge variant="secondary">{data.classifier || "N/A"}</Badge>,
        },
        cell: {
          baseWidth: 15,
          ...getSyncedColumnData(tableSettings, "classifier"),
        },
      },
      {
        id: "lastBomImport",
        label: "Last BOM Import",
        data: {
          columnSortableValuePath: "lastBomImport",
          render: ({ data }) => {
            if (!data.lastBomImport) return <div className="text-muted-foreground text-sm">-</div>;
            const date = new Date(data.lastBomImport);
            return (
              <div className="text-sm">
                {date.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </div>
            );
          },
        },
        cell: {
          baseWidth: 18,
          ...getSyncedColumnData(tableSettings, "lastBomImport"),
        },
      },
      {
        id: "lastBomImportFormat",
        label: "BOM Format",
        data: {
          columnSortableValuePath: "lastBomImportFormat",
          render: ({ data }) => <div className="text-sm">{data.lastBomImportFormat || "-"}</div>,
        },
        cell: {
          baseWidth: 13,
          ...getSyncedColumnData(tableSettings, "lastBomImportFormat"),
        },
      },
      {
        id: "riskScore",
        label: "Risk Score",
        data: {
          columnSortableValuePath: "lastInheritedRiskScore",
          render: ({ data }) => <div className="text-sm">{data.lastInheritedRiskScore?.toFixed(1) || "0.0"}</div>,
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "riskScore"),
        },
      },
      {
        id: "active",
        label: "Active",
        data: {
          columnSortableValuePath: "active",
          render: ({ data }) => (
            <Badge variant={data.active ? "success" : "error"}>{data.active ? "Active" : "Inactive"}</Badge>
          ),
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, "active"),
        },
      },
      {
        id: "vulnerabilities",
        label: "Vulnerabilities",
        data: {
          columnSortableValuePath: "metrics.vulnerabilities",
          render: ({ data }) => {
            if (!data.metrics) {
              return <div className="text-muted-foreground text-sm">-</div>;
            }
            return (
              <VulnerabilityProgressBar
                critical={data.metrics.critical || 0}
                high={data.metrics.high || 0}
                medium={data.metrics.medium || 0}
                low={data.metrics.low || 0}
                unassigned={data.metrics.unassigned || 0}
                total={data.metrics.vulnerabilities || 0}
              />
            );
          },
        },
        cell: {
          baseWidth: 20,
          ...getSyncedColumnData(tableSettings, "vulnerabilities"),
        },
      },
      {
        id: "policyViolations",
        label: "Policy Violations",
        data: {
          columnSortableValuePath: "metrics.policyViolationsTotal",
          render: ({ data }) => {
            if (!data.metrics) {
              return <div className="text-muted-foreground text-sm">-</div>;
            }
            return <PolicyViolationProgressBar metrics={data.metrics} />;
          },
        },
        cell: {
          baseWidth: 20,
          hidden: true, // Hidden by default, user can show via column settings
          ...getSyncedColumnData(tableSettings, "policyViolations"),
        },
      },
    ],
    [tableSettings, namespace, clusterName]
  );
};
