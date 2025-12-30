import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { PolicyViolation } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { ViolationStateBadge } from "../components/ViolationStateBadge";
import { ViolationAnalysisStateBadge } from "../components/ViolationAnalysisStateBadge";

/**
 * Hook to define columns for the Policy Violations table
 */
export function useViolationsColumns(): TableColumn<PolicyViolation>[] {
  return useMemo(
    () => [
      {
        id: "state",
        label: "State",
        data: {
          columnSortableValuePath: "policyCondition.policy.violationState",
          render: ({ data }) => <ViolationStateBadge state={data.policyCondition.policy.violationState} />,
        },
        cell: {
          baseWidth: 10,
        },
      },
      {
        id: "type",
        label: "Type",
        data: {
          columnSortableValuePath: "type",
          render: ({ data }) => <span className="text-sm font-medium capitalize">{data.type.toLowerCase()}</span>,
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "policyName",
        label: "Policy Name",
        data: {
          columnSortableValuePath: "policyCondition.policy.name",
          render: ({ data }) => <span className="text-sm font-medium">{data.policyCondition.policy.name}</span>,
        },
        cell: {
          baseWidth: 20,
        },
      },
      {
        id: "component",
        label: "Component",
        data: {
          columnSortableValuePath: "component.name",
          render: ({ data }) => {
            const component = data.component;
            if (!component) return <span className="text-muted-foreground text-xs">-</span>;

            return (
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{component.name}</div>
                {component.version && <div className="text-muted-foreground text-xs">v{component.version}</div>}
              </div>
            );
          },
        },
        cell: {
          baseWidth: 18,
        },
      },
      {
        id: "timestamp",
        label: "Occurred On",
        data: {
          columnSortableValuePath: "timestamp",
          render: ({ data }) => (
            <span className="text-muted-foreground text-xs">{new Date(data.timestamp).toLocaleString()}</span>
          ),
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "analysis",
        label: "Analysis",
        data: {
          columnSortableValuePath: "analysis.analysisState",
          render: ({ data }) => <ViolationAnalysisStateBadge state={data.analysis.analysisState} />,
        },
        cell: {
          baseWidth: 12,
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
