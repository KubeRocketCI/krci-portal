import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { SeverityBadge } from "@/modules/platform/security/components/shared/SeverityBadge";
import { Badge } from "@/core/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { AuditCheckWithId } from "../types";
import { compareBySeverity } from "@/modules/platform/security/constants/severity";

/**
 * Hook to define columns for the Configuration Audit Checks table.
 */
export function useCheckColumns(): TableColumn<AuditCheckWithId>[] {
  return useMemo(
    () => [
      {
        id: "checkID",
        label: "Check ID",
        data: {
          columnSortableValuePath: "checkID",
          render: ({ data }) => <span className="font-mono text-sm font-medium">{data.checkID}</span>,
        },
        cell: {
          isFixed: true,
          baseWidth: 15,
        },
      },
      {
        id: "title",
        label: "Title",
        data: {
          columnSortableValuePath: "title",
          render: ({ data }) => (
            <span className="line-clamp-1 text-sm" title={data.title || ""}>
              {data.title || "-"}
            </span>
          ),
        },
        cell: {
          baseWidth: 35,
        },
      },
      {
        id: "category",
        label: "Category",
        data: {
          columnSortableValuePath: "category",
          render: ({ data }) => {
            if (!data.category) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }
            return (
              <Badge variant="outline" className="text-xs">
                {data.category}
              </Badge>
            );
          },
        },
        cell: {
          baseWidth: 25,
        },
      },
      {
        id: "severity",
        label: "Severity",
        data: {
          columnSortableValuePath: "severity",
          customSortFn: (a, b) => compareBySeverity(a.severity, b.severity),
          render: ({ data }) => <SeverityBadge severity={data.severity} />,
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "status",
        label: "Status",
        data: {
          customSortFn: (a, b) => {
            // Sort failed (false) before passed (true)
            return (a.success ? 1 : 0) - (b.success ? 1 : 0);
          },
          render: ({ data }) => {
            if (data.success) {
              return (
                <Badge variant="success">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Pass
                </Badge>
              );
            }
            return (
              <Badge variant="error">
                <XCircle className="mr-1 h-3 w-3" />
                Fail
              </Badge>
            );
          },
        },
        cell: {
          baseWidth: 12,
        },
      },
    ],
    []
  );
}
