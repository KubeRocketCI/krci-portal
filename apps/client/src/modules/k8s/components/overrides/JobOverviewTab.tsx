import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { getJobStatusIcon, getJobStatusLabel } from "@/k8s/api/groups/batch/Job/utils/getStatus";
import type { Job, KubeObjectBase } from "@my-project/shared";
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

interface JobSpecView {
  parallelism?: number;
  completions?: number;
  backoffLimit?: number;
  activeDeadlineSeconds?: number;
  ttlSecondsAfterFinished?: number;
  selector?: { matchLabels?: Record<string, string> };
  template?: {
    spec?: {
      serviceAccountName?: string;
      serviceAccount?: string;
      containers?: Array<{ name: string; image?: string; imagePullPolicy?: string }>;
    };
  };
}

export function JobOverviewTab({ item }: { item: KubeObjectBase }) {
  const job = item as Job;
  const { pods, isLoading } = useOwnedPods(job, { fallbackLabels: { "job-name": job.metadata?.name ?? "" } });

  const spec = job.spec as JobSpecView | undefined;
  const status = job.status;
  const succeeded = status?.succeeded ?? 0;
  const failed = status?.failed ?? 0;
  const active = status?.active ?? 0;
  const completions = spec?.completions ?? 1;
  const created = job.metadata?.creationTimestamp;
  const startTime = status?.startTime;
  const completionTime = status?.completionTime;

  const containers = spec?.template?.spec?.containers ?? [];
  const podSpec = spec?.template?.spec;
  const owner = job.metadata?.ownerReferences?.[0];

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={<StatusBadge statusIcon={getJobStatusIcon(job)} label={getJobStatusLabel(job)} />}
          sub="Health"
        />
        <WorkloadSummaryCard
          label="Completions"
          value={<ReplicaProgress ready={succeeded} desired={completions} />}
          sub="Target"
        />
        <WorkloadSummaryCard label="Succeeded" value={succeeded} sub="Pods" />
        <WorkloadSummaryCard label="Failed" value={failed} sub="Pods" />
        <WorkloadSummaryCard label="Active" value={active} sub="Pods" />
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
            <WorkloadInfoRow label="Parallelism">{spec?.parallelism ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Completions">{spec?.completions ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Backoff Limit">{spec?.backoffLimit ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Active Deadline">
              {spec?.activeDeadlineSeconds !== undefined ? `${spec.activeDeadlineSeconds}s` : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="TTL After Finished">
              {spec?.ttlSecondsAfterFinished !== undefined ? `${spec.ttlSecondsAfterFinished}s` : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Start Time">
              {startTime ? (
                <Tooltip title={startTime}>
                  <span>{formatTimestamp(startTime)}</span>
                </Tooltip>
              ) : (
                "—"
              )}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Completion Time">
              {completionTime ? (
                <Tooltip title={completionTime}>
                  <span>{formatTimestamp(completionTime)}</span>
                </Tooltip>
              ) : (
                "—"
              )}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Service Account" mono>
              {podSpec?.serviceAccountName ?? podSpec?.serviceAccount ?? "default"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Containers">{containers.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="Images" full>
              <ContainerImagesList containers={containers} />
            </WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {job.metadata?.uid ?? "—"}
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
