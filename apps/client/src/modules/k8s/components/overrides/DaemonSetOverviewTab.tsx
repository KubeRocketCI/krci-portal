import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { getDaemonSetStatusIcon, getDaemonSetStatusLabel } from "@/k8s/api/groups/apps/DaemonSet/utils/getStatus";
import type { DaemonSet, KubeObjectBase } from "@my-project/shared";
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

const DAEMONSET_REVISION_ANNOTATION = "daemonset.kubernetes.io/revision";

interface DaemonSetSpecView {
  selector?: { matchLabels?: Record<string, string> };
  updateStrategy?: {
    type?: string;
    rollingUpdate?: { maxUnavailable?: string | number };
  };
  template?: {
    spec?: {
      serviceAccountName?: string;
      serviceAccount?: string;
      containers?: Array<{ name: string; image?: string; imagePullPolicy?: string }>;
    };
  };
}

interface DaemonSetStatusView {
  updatedNumberScheduled?: number;
}

export function DaemonSetOverviewTab({ item }: { item: KubeObjectBase }) {
  const daemonSet = item as DaemonSet;
  const { pods, isLoading } = useOwnedPods(daemonSet);

  const spec = daemonSet.spec as DaemonSetSpecView | undefined;
  const status = daemonSet.status;
  const statusView = daemonSet.status as DaemonSetStatusView | undefined;
  const desired = status?.desiredNumberScheduled ?? 0;
  const ready = status?.numberReady ?? 0;
  const updated = statusView?.updatedNumberScheduled ?? 0;
  const available = status?.numberAvailable ?? 0;
  const created = daemonSet.metadata?.creationTimestamp;

  const containers = spec?.template?.spec?.containers ?? [];
  const podSpec = spec?.template?.spec;
  const selector = spec?.selector?.matchLabels ?? {};
  const owner = daemonSet.metadata?.ownerReferences?.[0];
  const annotations = daemonSet.metadata?.annotations ?? {};
  const revision = annotations[DAEMONSET_REVISION_ANNOTATION];
  const updateStrategy = spec?.updateStrategy;

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={
            <StatusBadge statusIcon={getDaemonSetStatusIcon(daemonSet)} label={getDaemonSetStatusLabel(daemonSet)} />
          }
          sub="Health"
        />
        <WorkloadSummaryCard label="Desired" value={desired} sub="pods" />
        <WorkloadSummaryCard label="Ready" value={<ReplicaProgress ready={ready} desired={desired} />} sub="pods" />
        <WorkloadSummaryCard label="Up-to-date" value={updated} sub="pods" />
        <WorkloadSummaryCard label="Available" value={available} sub="pods" />
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
            <WorkloadInfoRow label="Update Strategy">{updateStrategy?.type ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Max Unavailable">
              {updateStrategy?.rollingUpdate?.maxUnavailable ?? "—"}
            </WorkloadInfoRow>
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
              {daemonSet.metadata?.uid ?? "—"}
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
