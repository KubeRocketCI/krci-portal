import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { Tooltip } from "@/core/components/ui/tooltip";
import { PolicyRulesCard, type PolicyRule } from "@/modules/k8s/components/rbac";
import type { ClusterRole, KubeObjectBase } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

export function ClusterRoleOverviewTab({ item }: { item: KubeObjectBase }) {
  const clusterRole = item as ClusterRole;
  const rules: PolicyRule[] = clusterRole.rules ?? [];
  const created = clusterRole.metadata?.creationTimestamp;
  const hasAggregationRule = Boolean((clusterRole as { aggregationRule?: unknown }).aggregationRule);

  const apiGroups = new Set<string>();
  const verbs = new Set<string>();
  for (const rule of rules) {
    for (const g of rule.apiGroups ?? []) {
      apiGroups.add(g || "core");
    }
    for (const v of rule.verbs ?? []) {
      verbs.add(v);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard label="Rules" value={rules.length} sub="Policy rules" />
        <WorkloadSummaryCard label="API Groups" value={apiGroups.size} sub="Distinct" />
        <WorkloadSummaryCard label="Verbs" value={verbs.size} sub="Distinct" />
        <WorkloadSummaryCard
          label="Created"
          value={formatRelativeTime(created)}
          sub={
            created ? (
              <Tooltip title={created}>
                <span>{formatTimestamp(created)}</span>
              </Tooltip>
            ) : (
              "—"
            )
          }
        />
      </WorkloadSummaryGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <PolicyRulesCard rules={rules} />
          <WorkloadInformationCard>
            <WorkloadInfoRow label="Rules">{rules.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="Aggregation Rule">{hasAggregationRule ? "Yes" : "No"}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {clusterRole.metadata?.uid ?? "—"}
            </WorkloadInfoRow>
          </WorkloadInformationCard>
        </div>
        <div className="lg:col-span-1">
          <WorkloadOverviewSidebar item={item} />
        </div>
      </div>
    </div>
  );
}
