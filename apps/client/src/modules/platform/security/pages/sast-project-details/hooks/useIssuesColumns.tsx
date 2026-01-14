import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { SonarQubeIssue, IssueComponent } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { getSeverityConfig } from "../utils/severityConfig";
import { formatDebtTime, formatDate } from "../utils/formatters";

function getComponentName(componentKey: string, components?: IssueComponent[]): string {
  if (!components) return componentKey;

  const component = components.find((c) => c.key === componentKey);
  return component?.path || component?.name || componentKey;
}

function getTypeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  const typeMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    BUG: "destructive",
    VULNERABILITY: "destructive",
    CODE_SMELL: "secondary",
  };
  return typeMap[type] || "outline";
}

export function useIssuesColumns(components?: IssueComponent[]): TableColumn<SonarQubeIssue>[] {
  return useMemo(
    () => [
      {
        id: "severity",
        label: "Severity",
        data: {
          columnSortableValuePath: "severity",
          render: ({ data }) => {
            const severityConfig = getSeverityConfig(data.severity);
            const SeverityIcon = severityConfig.icon;
            return (
              <Badge variant={severityConfig.badgeVariant} className="gap-1">
                <SeverityIcon className="h-3 w-3" />
                {data.severity}
              </Badge>
            );
          },
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "type",
        label: "Type",
        data: {
          columnSortableValuePath: "type",
          render: ({ data }) => <Badge variant={getTypeVariant(data.type)}>{data.type}</Badge>,
        },
        cell: {
          baseWidth: 13,
        },
      },
      {
        id: "message",
        label: "Message",
        data: {
          columnSortableValuePath: "message",
          render: ({ data }) => (
            <div className="max-w-md truncate" title={data.message}>
              {data.message}
            </div>
          ),
        },
        cell: {
          baseWidth: 34,
        },
      },
      {
        id: "file",
        label: "File",
        data: {
          columnSortableValuePath: "component",
          render: ({ data }) => {
            const componentName = getComponentName(data.component, components);
            return (
              <div className="text-muted-foreground max-w-xs truncate text-sm" title={componentName}>
                {componentName}
                {data.line && <span className="text-primary">:{data.line}</span>}
              </div>
            );
          },
        },
        cell: {
          baseWidth: 20,
        },
      },
      {
        id: "effort",
        label: "Effort",
        data: {
          columnSortableValuePath: "effort",
          render: ({ data }) => <span className="text-muted-foreground text-sm">{formatDebtTime(data.effort)}</span>,
        },
        cell: {
          baseWidth: 10,
        },
      },
      {
        id: "created",
        label: "Created",
        data: {
          columnSortableValuePath: "creationDate",
          render: ({ data }) => <span className="text-muted-foreground text-sm">{formatDate(data.creationDate)}</span>,
        },
        cell: {
          baseWidth: 11,
        },
      },
    ],
    [components]
  );
}
