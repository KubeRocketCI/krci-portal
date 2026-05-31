import { Alert } from "@/core/components/ui/alert";
import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { getDeploymentStatusIcon, getDeploymentStatusLabel } from "@/k8s/api/groups/apps/Deployment/utils/getStatus";
import { DEPLOYMENT_REVISION_ANNOTATION } from "@my-project/shared";
import type { Deployment, KubeObjectBase } from "@my-project/shared";
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

interface DeploymentSpecView {
  replicas?: number;
  selector?: { matchLabels?: Record<string, string> };
  paused?: boolean;
  minReadySeconds?: number;
  progressDeadlineSeconds?: number;
  strategy?: {
    type?: string;
    rollingUpdate?: { maxSurge?: string | number; maxUnavailable?: string | number };
  };
  template?: {
    spec?: {
      serviceAccountName?: string;
      serviceAccount?: string;
      containers?: Array<{ name: string; image?: string; imagePullPolicy?: string }>;
    };
  };
}

export function DeploymentOverviewTab({ item }: { item: KubeObjectBase }) {
  const deployment = item as Deployment;
  const { pods, isLoading } = useOwnedPods(deployment);

  const spec = deployment.spec as DeploymentSpecView | undefined;
  const status = deployment.status;
  const desired = spec?.replicas ?? 0;
  const ready = status?.readyReplicas ?? 0;
  const updated = status?.updatedReplicas ?? 0;
  const available = status?.availableReplicas ?? 0;
  const created = deployment.metadata?.creationTimestamp;

  const containers = spec?.template?.spec?.containers ?? [];
  const podSpec = spec?.template?.spec;
  const selector = spec?.selector?.matchLabels ?? {};
  const owner = deployment.metadata?.ownerReferences?.[0];
  const annotations = deployment.metadata?.annotations ?? {};
  const revision = annotations[DEPLOYMENT_REVISION_ANNOTATION];
  const strategy = spec?.strategy;

  const conditions = status?.conditions as Array<{ type?: string; status?: string; message?: string }> | undefined;
  const replicaFailure = conditions?.find((c) => c.type === "ReplicaFailure" && c.status === "True");

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={
            <StatusBadge
              statusIcon={getDeploymentStatusIcon(deployment)}
              label={getDeploymentStatusLabel(deployment)}
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
        <WorkloadSummaryCard label="Up-to-date" value={updated} sub="Updated" />
        <WorkloadSummaryCard label="Available" value={available} sub="Serving" />
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

      {replicaFailure && (
        <Alert variant="destructive" title="ReplicaFailure">
          {replicaFailure.message ?? "One or more replicas failed to be created."}
        </Alert>
      )}

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
            <WorkloadInfoRow label="Strategy">{strategy?.type ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Service Account" mono>
              {podSpec?.serviceAccountName ?? podSpec?.serviceAccount ?? "default"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Max Surge">{strategy?.rollingUpdate?.maxSurge ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Max Unavailable">{strategy?.rollingUpdate?.maxUnavailable ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Min Ready">
              {spec?.minReadySeconds !== undefined ? `${spec.minReadySeconds}s` : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Containers">{containers.length}</WorkloadInfoRow>
            {spec?.paused !== undefined && (
              <WorkloadInfoRow label="Paused">{spec.paused ? "Yes" : "No"}</WorkloadInfoRow>
            )}
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
              {deployment.metadata?.uid ?? "—"}
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
