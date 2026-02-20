import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { ClusterRbacAssessmentReport } from "@my-project/shared";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS_FULL } from "../../trivy-cluster-rbac-assessment-details/route";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { Eye } from "lucide-react";
import { Button } from "@/core/components/ui/button";

export function useColumns(): TableColumn<ClusterRbacAssessmentReport>[] {
  const { loadSettings } = useTableSettings(TABLE.TRIVY_CLUSTER_RBAC_ASSESSMENT_REPORTS_LIST.id);
  const tableSettings = loadSettings();
  const { clusterName } = useParams({ strict: false });

  return useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({ data }) => {
            return (
              <Link
                to={PATH_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS_FULL}
                params={{
                  name: data.metadata?.name || "",
                  clusterName: clusterName || "",
                }}
                className="text-foreground hover:text-primary hover:underline"
              >
                <span>{data.metadata?.name || "-"}</span>
              </Link>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 30,
          ...getSyncedColumnData(tableSettings, "name"),
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
          baseWidth: 10,
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
          baseWidth: 10,
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
          baseWidth: 10,
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
          baseWidth: 10,
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
        id: "actions",
        label: "",
        data: {
          render: ({ data }) => (
            <Link
              to={PATH_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS_FULL}
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
