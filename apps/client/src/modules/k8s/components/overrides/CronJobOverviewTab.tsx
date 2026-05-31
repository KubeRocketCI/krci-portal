import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { StatusBadge } from "@/core/components/StatusBadge";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import { getCronJobStatusIcon, getCronJobStatusLabel } from "@/k8s/api/groups/batch/CronJob/utils/getStatus";
import { getJobStatusIcon, getJobStatusLabel } from "@/k8s/api/groups/batch/Job/utils/getStatus";
import { k8sJobConfig } from "@my-project/shared";
import type { CronJob, Job, KubeObjectBase } from "@my-project/shared";
import { useK8sResourceList } from "../../hooks/useK8sResourceList";
import {
  ContainerImagesList,
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface CronJobSpecView {
  schedule?: string;
  suspend?: boolean;
  concurrencyPolicy?: string;
  startingDeadlineSeconds?: number;
  successfulJobsHistoryLimit?: number;
  failedJobsHistoryLimit?: number;
  jobTemplate?: {
    spec?: {
      template?: {
        spec?: {
          containers?: Array<{ name: string; image?: string; imagePullPolicy?: string }>;
        };
      };
    };
  };
}

interface CronJobStatusView {
  active?: unknown[];
  lastScheduleTime?: string;
  lastSuccessfulTime?: string;
}

function CronJobJobsCard({ jobs, isLoading }: { jobs: Job[]; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-baseline justify-between text-base font-semibold">
          <span>Jobs</span>
          <span className="text-muted-foreground text-xs">{jobs.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && jobs.length === 0 ? (
          <div className="text-muted-foreground p-4 text-sm">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="text-muted-foreground p-4 text-sm">No jobs found for this CronJob.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Completions</th>
                  <th className="px-4 py-2 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const icon = getJobStatusIcon(job);
                  const created = job.metadata?.creationTimestamp;
                  const succeeded = job.status?.succeeded ?? 0;
                  const completions = job.spec?.completions ?? 1;
                  return (
                    <tr key={job.metadata?.uid ?? job.metadata?.name} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{job.metadata?.name}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon
                            Icon={icon.component}
                            color={icon.color}
                            isSpinning={icon.isSpinning}
                            width={14}
                          />
                          <span className="text-xs">{getJobStatusLabel(job)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {succeeded}/{completions}
                      </td>
                      <td className="text-muted-foreground px-4 py-2">
                        {created ? (
                          <Tooltip title={created}>
                            <span>{formatRelativeTime(created)}</span>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CronJobOverviewTab({ item }: { item: KubeObjectBase }) {
  const cronJob = item as CronJob;

  const spec = cronJob.spec as CronJobSpecView | undefined;
  const status = cronJob.status as CronJobStatusView | undefined;
  const namespace = cronJob.metadata?.namespace ?? "";
  const name = cronJob.metadata?.name ?? "";

  const jobsResult = useK8sResourceList<Job>(k8sJobConfig, namespace);
  const allJobs = jobsResult.data.array;

  const jobs = useMemo(() => {
    return allJobs
      .filter((job) => (job.metadata?.ownerReferences ?? []).some((ref) => ref.kind === "CronJob" && ref.name === name))
      .sort((a, b) => {
        const aTime = a.metadata?.creationTimestamp ? new Date(a.metadata.creationTimestamp).getTime() : 0;
        const bTime = b.metadata?.creationTimestamp ? new Date(b.metadata.creationTimestamp).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [allJobs, name]);

  const active = status?.active?.length ?? 0;
  const lastScheduleTime = status?.lastScheduleTime;
  const lastSuccessfulTime = status?.lastSuccessfulTime;
  const created = cronJob.metadata?.creationTimestamp;

  const containers = spec?.jobTemplate?.spec?.template?.spec?.containers ?? [];
  const owner = cronJob.metadata?.ownerReferences?.[0];

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={<StatusBadge statusIcon={getCronJobStatusIcon(cronJob)} label={getCronJobStatusLabel(cronJob)} />}
          sub="Health"
        />
        <WorkloadSummaryCard
          label="Schedule"
          value={<span className="font-mono text-sm">{spec?.schedule ?? "—"}</span>}
          sub="Cron expression"
        />
        <WorkloadSummaryCard label="Active Jobs" value={active} sub="Running" />
        <WorkloadSummaryCard
          label="Last Schedule"
          value={lastScheduleTime ? formatRelativeTime(lastScheduleTime) : "—"}
          sub={
            lastScheduleTime ? (
              <Tooltip title={lastScheduleTime}>
                <span>{formatTimestamp(lastScheduleTime)}</span>
              </Tooltip>
            ) : (
              "—"
            )
          }
        />
        <WorkloadSummaryCard
          label="Last Successful"
          value={lastSuccessfulTime ? formatRelativeTime(lastSuccessfulTime) : "—"}
          sub={
            lastSuccessfulTime ? (
              <Tooltip title={lastSuccessfulTime}>
                <span>{formatTimestamp(lastSuccessfulTime)}</span>
              </Tooltip>
            ) : (
              "—"
            )
          }
        />
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
          <CronJobJobsCard jobs={jobs} isLoading={jobsResult.isLoading} />
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
            <WorkloadInfoRow label="Schedule" mono>
              {spec?.schedule ?? "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Suspend">{spec?.suspend ? "Yes" : "No"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Concurrency Policy">{spec?.concurrencyPolicy ?? "Allow"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Starting Deadline">
              {spec?.startingDeadlineSeconds !== undefined ? `${spec.startingDeadlineSeconds}s` : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Successful History Limit">
              {spec?.successfulJobsHistoryLimit ?? "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Failed History Limit">{spec?.failedJobsHistoryLimit ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Containers">{containers.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="Images" full>
              <ContainerImagesList containers={containers} />
            </WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {cronJob.metadata?.uid ?? "—"}
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
