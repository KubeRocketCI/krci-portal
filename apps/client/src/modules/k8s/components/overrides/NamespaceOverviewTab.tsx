import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { getNamespaceStatusIcon, getNamespaceStatusLabel } from "@/k8s/api/groups/Core/Namespace/utils/getStatus";
import type { KubeObjectBase, Namespace } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

export function NamespaceOverviewTab({ item }: { item: KubeObjectBase }) {
  const namespace = item as Namespace;

  const phase = namespace.status?.phase;
  const created = namespace.metadata?.creationTimestamp;
  const labels = namespace.metadata?.labels ?? {};
  const annotations = namespace.metadata?.annotations ?? {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={
            <StatusBadge statusIcon={getNamespaceStatusIcon(namespace)} label={getNamespaceStatusLabel(namespace)} />
          }
          sub="Health"
        />
        <WorkloadSummaryCard label="Phase" value={phase ?? "—"} sub="Lifecycle" />
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
          <WorkloadInformationCard>
            <WorkloadInfoRow label="Phase">{phase ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Labels">{Object.keys(labels).length}</WorkloadInfoRow>
            <WorkloadInfoRow label="Annotations">{Object.keys(annotations).length}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {namespace.metadata?.uid ?? "—"}
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
