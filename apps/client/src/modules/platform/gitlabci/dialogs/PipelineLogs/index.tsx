import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { LogViewer } from "@/core/components/LogViewer";
import { StatusIcon } from "@/core/components/StatusIcon";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { formatDuration } from "@/core/utils/date-humanize";
import { useQuery } from "@tanstack/react-query";
import { GitFusionPipelineJob } from "@my-project/shared";
import { AlertTriangle, ExternalLink, GitBranch } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { GitLabCIPipelineStatus } from "../../components/PipelineStatus";
import { getGitLabCIPipelineStatusIcon, isGitLabCIPipelineActive } from "../../utils/getStatusIcon";
import { GITLABCI_PIPELINE_LOGS_DIALOG_NAME } from "./constants";
import type { GitLabCIPipelineLogsDialogPropsWithBase } from "./types";

// Mirrors GitFusion's server-side trace size cap.
const TRACE_LIMIT_LABEL = "4 MB";

const formatJobDuration = (job: GitFusionPipelineJob): string | null => {
  if (job.started_at && job.finished_at) {
    return formatDuration(job.started_at, job.finished_at);
  }
  if (typeof job.duration === "number" && job.duration > 0) {
    return `${Math.round(job.duration)}s`;
  }
  return null;
};

// Default to the first failed job so errors surface first.
const pickDefaultJob = (jobs: GitFusionPipelineJob[]): string | null => {
  if (jobs.length === 0) return null;
  // status is unvalidated HTTP data, so guard with `?? ""` (as getStatusIcon/isGitLabCIPipelineActive
  // do) and compare case-insensitively.
  const failed = jobs.find((j) => (j.status ?? "").toLowerCase() === "failed");
  return (failed ?? jobs[0]).id;
};

function JobRow({ job, selected, onClick }: { job: GitFusionPipelineJob; selected: boolean; onClick: () => void }) {
  const statusIcon = getGitLabCIPipelineStatusIcon(job.status);
  const duration = formatJobDuration(job);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
        selected ? "bg-muted font-medium" : "hover:bg-muted/60"
      }`}
    >
      <span className="inline-flex shrink-0">
        <StatusIcon
          Icon={statusIcon.component}
          color={statusIcon.color}
          isSpinning={statusIcon.isSpinning}
          width={14}
        />
      </span>
      <span className="min-w-0 flex-1 truncate">
        <TextWithTooltip text={job.name} />
      </span>
      {duration && <span className="text-muted-foreground shrink-0 text-xs">{duration}</span>}
    </button>
  );
}

export function GitLabCIPipelineLogsDialog({
  props: { gitServer, project, pipelineId, pipelineStatus, codebaseName, ref, webUrl },
  state: { open, closeDialog },
}: GitLabCIPipelineLogsDialogPropsWithBase) {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

  const pipelineActive = isGitLabCIPipelineActive(pipelineStatus);

  const jobsQuery = useQuery({
    queryKey: ["gitfusion", "pipelineJobs", clusterName, defaultNamespace, gitServer, project, pipelineId],
    queryFn: () =>
      trpc.gitfusion.getPipelineJobList.query({
        clusterName,
        namespace: defaultNamespace,
        gitServer,
        project,
        pipelineId,
      }),
    enabled: open && !!pipelineId,
    // pipelineStatus is a dialog-open snapshot that never updates, so derive liveness from
    // the freshest polled jobs (fall back to it until the first response). Stops once terminal.
    refetchInterval: (query) => {
      const polledJobs = query.state.data?.data ?? [];
      const active =
        polledJobs.length > 0 ? polledJobs.some((job) => isGitLabCIPipelineActive(job.status)) : pipelineActive;
      return active ? 5000 : false;
    },
    // Active pipelines refetch eagerly (incl. on focus); terminal pipelines have an
    // immutable job list, so cache it indefinitely and avoid redundant refetches.
    staleTime: pipelineActive ? 0 : Infinity,
  });

  const jobs = React.useMemo(() => jobsQuery.data?.data ?? [], [jobsQuery.data]);

  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (jobs.length === 0) return;
    setSelectedJobId((current) => (current && jobs.some((j) => j.id === current) ? current : pickDefaultJob(jobs)));
  }, [jobs]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const selectedJobActive = isGitLabCIPipelineActive(selectedJob?.status);

  const selectedJobStatusIcon = selectedJob ? getGitLabCIPipelineStatusIcon(selectedJob.status) : null;

  const traceQuery = useQuery({
    queryKey: ["gitfusion", "jobTrace", clusterName, defaultNamespace, gitServer, project, selectedJobId],
    queryFn: () =>
      trpc.gitfusion.getPipelineJobTrace.query({
        clusterName,
        namespace: defaultNamespace,
        gitServer,
        project,
        jobId: selectedJobId!,
      }),
    enabled: open && !!selectedJobId,
    refetchInterval: selectedJobActive ? 5000 : false,
    // Active job logs refetch eagerly; a finished job's trace is immutable, so cache it.
    staleTime: selectedJobActive ? 0 : Infinity,
  });

  // Group jobs by stage, preserving first-seen stage order (execution order).
  const stages = React.useMemo(() => {
    const order: string[] = [];
    const byStage = new Map<string, GitFusionPipelineJob[]>();
    for (const job of jobs) {
      if (!byStage.has(job.stage)) {
        byStage.set(job.stage, []);
        order.push(job.stage);
      }
      byStage.get(job.stage)!.push(job);
    }
    return order.map((stage) => ({ stage, jobs: byStage.get(stage)! }));
  }, [jobs]);

  const traceContent = traceQuery.data?.content ?? "";
  const traceTruncated = traceQuery.data?.truncated === true;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="flex h-[90vh] w-full max-w-[1400px] flex-col p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex flex-wrap items-center gap-3 text-xl font-semibold">
            <span>Pipeline #{pipelineId}</span>
            <GitLabCIPipelineStatus status={pipelineStatus} />
            <span className="text-muted-foreground inline-flex items-center gap-1 text-sm font-normal">
              {codebaseName}
            </span>
            <span className="text-muted-foreground inline-flex items-center gap-1 text-sm font-normal">
              <GitBranch className="size-3.5" /> {ref}
            </span>
            <Button variant="link" size="sm" asChild className="ml-auto p-0">
              <a href={webUrl} target="_blank" rel="noopener noreferrer">
                Open in GitLab <ExternalLink className="ml-1 size-3.5" />
              </a>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 gap-4 p-4">
          <div className="w-[280px] shrink-0">
            <Card className="flex h-full flex-col">
              <div className="border-b px-4 py-3">
                <h3 className="text-foreground font-medium">Jobs</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-auto p-2">
                {jobsQuery.isLoading && <p className="text-muted-foreground px-2 py-1 text-sm">Loading jobs…</p>}
                {jobsQuery.isError && (
                  <p className="text-destructive px-2 py-1 text-sm">Failed to load jobs: {String(jobsQuery.error)}</p>
                )}
                {!jobsQuery.isLoading && !jobsQuery.isError && jobs.length === 0 && (
                  <p className="text-muted-foreground px-2 py-1 text-sm">No jobs found for this pipeline.</p>
                )}
                {stages.map(({ stage, jobs: stageJobs }) => (
                  <div key={stage}>
                    <p className="text-muted-foreground px-2 pb-1 text-xs font-medium tracking-wide uppercase">
                      {stage}
                    </p>
                    <div className="space-y-0.5">
                      {stageJobs.map((job) => (
                        <JobRow
                          key={job.id}
                          job={job}
                          selected={job.id === selectedJobId}
                          onClick={() => setSelectedJobId(job.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex h-full flex-col overflow-hidden">
              {selectedJob && selectedJobStatusIcon && (
                <div className="mb-2 flex items-center gap-2 px-1 text-sm">
                  <StatusIcon
                    Icon={selectedJobStatusIcon.component}
                    color={selectedJobStatusIcon.color}
                    isSpinning={selectedJobStatusIcon.isSpinning}
                    width={14}
                  />
                  <span className="font-medium">{selectedJob.name}</span>
                  {selectedJob.failure_reason && (
                    <span className="text-muted-foreground text-xs">({selectedJob.failure_reason})</span>
                  )}
                </div>
              )}
              {traceTruncated && (
                <div className="mb-2 flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>
                    Log truncated at {TRACE_LIMIT_LABEL}.{" "}
                    <a
                      href={webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline underline-offset-2"
                    >
                      Open in GitLab
                    </a>{" "}
                    for the full trace.
                  </span>
                </div>
              )}
              <div className="min-h-0 flex-1">
                <LogViewer
                  content={traceContent}
                  isLoading={traceQuery.isLoading && !traceContent}
                  error={traceQuery.error ? String(traceQuery.error) : undefined}
                  emptyMessage={selectedJobId ? "No log output for this job." : "Select a job to view its logs."}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

GitLabCIPipelineLogsDialog.displayName = GITLABCI_PIPELINE_LOGS_DIALOG_NAME;
