import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { Badge } from "@/core/components/ui/badge";
import { QualityGateCondition } from "@my-project/shared";
import { QUALITY_GATE_COLORS, SONARQUBE_METRIC_NAMES, SONARQUBE_OPERATORS } from "../../sast/constants";
import { cn } from "@/core/utils/classname";

function formatMetricName(metricKey: string): string {
  return SONARQUBE_METRIC_NAMES[metricKey] || metricKey;
}

function formatOperator(comparator: string | undefined): string {
  if (!comparator) return "—";
  return SONARQUBE_OPERATORS[comparator] || comparator;
}

export function useConditionsColumns(): TableColumn<QualityGateCondition>[] {
  return useMemo(
    () => [
      {
        id: "metric",
        label: "Metric",
        data: {
          columnSortableValuePath: "metricKey",
          render: ({ data }) => <span className="font-medium">{formatMetricName(data.metricKey)}</span>,
        },
        cell: {
          baseWidth: 30,
        },
      },
      {
        id: "operator",
        label: "Operator",
        data: {
          columnSortableValuePath: "comparator",
          render: ({ data }) => <span>{formatOperator(data.comparator)}</span>,
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "threshold",
        label: "Threshold",
        data: {
          columnSortableValuePath: "errorThreshold",
          render: ({ data }) => <span>{data.errorThreshold || "—"}</span>,
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "actual",
        label: "Actual",
        data: {
          columnSortableValuePath: "actualValue",
          render: ({ data }) => <span>{data.actualValue || "—"}</span>,
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "status",
        label: "Status",
        data: {
          columnSortableValuePath: "status",
          render: ({ data }) => {
            const statusKey = data.status as keyof typeof QUALITY_GATE_COLORS;
            const statusColorClass = QUALITY_GATE_COLORS[statusKey]?.combined || QUALITY_GATE_COLORS.NONE.combined;
            return (
              <Badge variant="outline" className={cn(statusColorClass)}>
                {data.status}
              </Badge>
            );
          },
        },
        cell: {
          baseWidth: 25,
        },
      },
    ],
    []
  );
}
