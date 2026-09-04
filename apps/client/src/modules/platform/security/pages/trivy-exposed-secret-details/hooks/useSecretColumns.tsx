import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { SeverityBadge } from "@/modules/platform/security/components/shared/SeverityBadge";
import { Badge } from "@/core/components/ui/badge";
import { ExposedSecretWithId } from "../types";
import { compareBySeverity } from "@/modules/platform/security/constants/severity";

export function useSecretColumns(): TableColumn<ExposedSecretWithId>[] {
  return useMemo(
    () => [
      {
        id: "ruleID",
        label: "Rule ID",
        data: {
          columnSortableValuePath: "ruleID",
          render: ({ data }) => <span className="font-mono text-sm font-medium">{data.ruleID}</span>,
        },
        cell: {
          isFixed: true,
          baseWidth: 18,
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
          baseWidth: 22,
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
          baseWidth: 15,
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
        id: "target",
        label: "Target",
        data: {
          columnSortableValuePath: "target",
          render: ({ data }) => (
            <span className="font-mono text-xs" title={data.target}>
              {data.target}
            </span>
          ),
        },
        cell: {
          baseWidth: 20,
        },
      },
      {
        id: "match",
        label: "Match",
        data: {
          render: ({ data }) => (
            <span className="text-muted-foreground line-clamp-1 font-mono text-xs" title={data.match || ""}>
              {data.match || "-"}
            </span>
          ),
        },
        cell: {
          baseWidth: 13,
        },
      },
    ],
    []
  );
}
