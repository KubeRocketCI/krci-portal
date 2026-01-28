import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { ControlTableRow } from "../types";
import { SeverityBadge } from "@/modules/platform/security/components/shared/SeverityBadge";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import { compareBySeverity } from "@/modules/platform/security/constants/severity";

/**
 * Hook to define columns for the Compliance Controls table.
 */
export function useControlColumns(): TableColumn<ControlTableRow>[] {
  const { loadSettings } = useTableSettings(TABLE.TRIVY_COMPLIANCE_CONTROLS_LIST.id);
  const tableSettings = loadSettings();

  return useMemo(
    () => [
      {
        id: "id",
        label: "Control ID",
        data: {
          columnSortableValuePath: "id",
          render: ({ data }) => <span className="font-mono text-sm font-medium">{data.id}</span>,
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, "id"),
        },
      },
      {
        id: "name",
        label: "Name",
        data: {
          columnSortableValuePath: "name",
          render: ({ data }) => {
            const name = data.name;
            const shouldTruncate = name.length > 80;

            if (shouldTruncate) {
              return (
                <Tooltip title={name}>
                  <span className="text-sm">{name.substring(0, 80)}...</span>
                </Tooltip>
              );
            }

            return <span className="text-sm">{name}</span>;
          },
        },
        cell: {
          baseWidth: 40,
          ...getSyncedColumnData(tableSettings, "name"),
        },
      },
      {
        id: "severity",
        label: "Severity",
        data: {
          customSortFn: (a, b) => compareBySeverity(a.severity, b.severity),
          render: ({ data }) => <SeverityBadge severity={data.severity} />,
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, "severity"),
        },
      },
      {
        id: "status",
        label: "Status",
        data: {
          customSortFn: (a, b) => {
            // Passed items come after failed items when sorting ascending
            return (a.passed ? 1 : 0) - (b.passed ? 1 : 0);
          },
          render: ({ data }) => (
            <Badge
              variant="outline"
              className={cn(
                data.passed
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              )}
            >
              {data.passed ? "Pass" : "Fail"}
            </Badge>
          ),
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "status"),
        },
      },
      {
        id: "failures",
        label: "Failures",
        data: {
          columnSortableValuePath: "totalFail",
          render: ({ data }) => {
            if (data.totalFail === undefined || data.totalFail === 0) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }
            return <span className="text-sm font-medium text-red-600 dark:text-red-400">{data.totalFail}</span>;
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, "failures"),
        },
      },
    ],
    [tableSettings]
  );
}
