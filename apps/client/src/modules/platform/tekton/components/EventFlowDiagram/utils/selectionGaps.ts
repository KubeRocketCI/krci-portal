import { SelectionGap } from "@/modules/platform/tekton/hooks/useEventListenerTopology";

/** User-facing copy for why the diagram may show fewer Triggers than the sink serves. */
export const describeSelectionGaps = (gaps: SelectionGap[]): string[] =>
  gaps.map((gap) => {
    switch (gap.kind) {
      case "triggersRestricted":
        return "Trigger CRs are not visible (RBAC or missing CRD), so Triggers matched by spec.labelSelector cannot be shown.";
      case "unsupportedOperators":
        return `spec.labelSelector.matchExpressions uses ${gap.operators.length === 1 ? "an operator" : "operators"} this view cannot evaluate (${gap.operators.join(", ")}); Triggers matched only by ${gap.operators.length === 1 ? "it" : "them"} are omitted.`;
      case "otherNamespaces": {
        // Tekton reads matchNames: ["*"] as every namespace in the cluster.
        const where = gap.namespaces.includes("*") ? "all namespaces" : gap.namespaces.join(", ");
        return `spec.namespaceSelector also selects Triggers from ${where}; only Triggers in this EventListener's own namespace are shown.`;
      }
    }
  });
