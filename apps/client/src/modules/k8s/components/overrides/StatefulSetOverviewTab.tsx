import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { getStatefulSetStatusIcon, getStatefulSetStatusLabel } from "@/k8s/api/groups/apps/StatefulSet/utils/getStatus";
import { DEPLOYMENT_REVISION_ANNOTATION } from "@my-project/shared";
import type { KubeObjectBase, StatefulSet } from "@my-project/shared";
import { useOwnedPods } from "../../hooks/useOwnedPods";
import {
  ContainerImagesList,
  ReplicaProgress,
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadPodsCard,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface StatefulSetSpecView {
  replicas?: number;
  selector?: { matchLabels?: Record<string, string> };
  serviceName?: string;
  podManagementPolicy?: string;
  updateStrategy?: { type?: string };
  volumeClaimTemplates?: unknown[];
  template?: {
    spec?: {
      serviceAccountName?: string;
      serviceAccount?: string;
      containers?: Array<{ name: string; image?: string; imagePullPolicy?: string }>;
    };
  };
}

interface StatefulSetStatusView {
  currentReplicas?: number;
}

export function StatefulSetOverviewTab({ item }: { item: KubeObjectBase }) {
  const statefulSet = item as StatefulSet;
  const { pods, isLoading } = useOwnedPods(statefulSet);

  const spec = statefulSet.spec as StatefulSetSpecView | undefined;
  const status = statefulSet.status;
  const statusView = status as StatefulSetStatusView | undefined;
  const desired = spec?.replicas ?? 0;
  const ready = status?.readyReplicas ?? 0;
  const current = statusView?.currentReplicas ?? 0;
  const updated = status?.updatedReplicas ?? 0;
  const created = statefulSet.metadata?.creationTimestamp;

  const containers = spec?.template?.spec?.containers ?? [];
  const podSpec = spec?.template?.spec;
  const selector = spec?.selector?.matchLabels ?? {};
  const owner = statefulSet.metadata?.ownerReferences?.[0];
  const annotations = statefulSet.metadata?.annotations ?? {};
  const revision = annotations[DEPLOYMENT_REVISION_ANNOTATION];
  const volumeClaimTemplatesCount = spec?.volumeClaimTemplates?.length ?? 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={
            <StatusBadge
              statusIcon={getStatefulSetStatusIcon(statefulSet)}
              label={getStatefulSetStatusLabel(statefulSet)}
            />
          }
          sub="Health"
        />
        <WorkloadSummaryCard label="Desired" value={desired} sub="Replicas" />
        <WorkloadSummaryCard
          label="Ready"
          value={<ReplicaProgress ready={ready} desired={desired} />}
          sub="Available pods"
        />
        <WorkloadSummaryCard label="Current" value={current} sub="Replicas" />
        <WorkloadSummaryCard label="Updated" value={updated} sub="Replicas" />
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
          <WorkloadPodsCard pods={pods} isLoading={isLoading} />
          <WorkloadInformationCard>
            <WorkloadInfoRow label="Owner">
              {owner ? (
                <span className="font-mono text-xs">
                  {owner.kind}/{owner.name}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Revision">{revision ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Service Name">{spec?.serviceName ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Update Strategy">{spec?.updateStrategy?.type ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Pod Management Policy">{spec?.podManagementPolicy ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Volume Claim Templates">{volumeClaimTemplatesCount}</WorkloadInfoRow>
            <WorkloadInfoRow label="Service Account" mono>
              {podSpec?.serviceAccountName ?? podSpec?.serviceAccount ?? "default"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Containers">{containers.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="Selector" mono full>
              {Object.keys(selector).length
                ? Object.entries(selector)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(", ")
                : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Images" full>
              <ContainerImagesList containers={containers} />
            </WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {statefulSet.metadata?.uid ?? "—"}
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
