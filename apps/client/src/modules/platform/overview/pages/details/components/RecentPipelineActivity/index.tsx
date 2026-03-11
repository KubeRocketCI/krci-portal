import { useMemo } from "react";
import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useClusterStore } from "@/k8s/store";
import { getPipelineRunStatus, pipelineRunStatus, pipelineRunReason, type PipelineRun } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { ArrowRight, GitCommit, CheckCircle2, XCircle, PlayCircle, Clock, Loader2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

const MAX_VISIBLE_RUNS = 6;

type StatusVariant = "success" | "error" | "info" | "neutral";

function getStatusDisplay(run: PipelineRun): { label: string; variant: StatusVariant; icon: typeof CheckCircle2 } {
  const { status, reason } = getPipelineRunStatus(run);
  const s = status.toLowerCase();
  const r = reason.toLowerCase();

  if (s === pipelineRunStatus.true) {
    return { label: "Succeeded", variant: "success", icon: CheckCircle2 };
  }
  if (s === pipelineRunStatus.false) {
    return { label: "Failed", variant: "error", icon: XCircle };
  }
  if (s === pipelineRunStatus.unknown) {
    if (r === pipelineRunReason.started || r === pipelineRunReason.running) {
      return { label: "Running", variant: "info", icon: PlayCircle };
    }
    if (r === pipelineRunReason.cancelled) {
      return { label: "Cancelled", variant: "neutral", icon: Clock };
    }
  }
  return { label: "Pending", variant: "neutral", icon: Clock };
}

function formatRelativeTime(timestamp: string | undefined): string {
  if (!timestamp) return "-";

  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDurationFromTimestamps(startTime?: string, completionTime?: string): string {
  if (!startTime) return "-";

  const start = new Date(startTime).getTime();
  const end = completionTime ? new Date(completionTime).getTime() : Date.now();
  const diffMs = end - start;

  if (diffMs < 0) return "-";

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function RecentPipelineActivity() {
  const pipelineRunListWatch = usePipelineRunWatchList();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const recentRuns = useMemo(() => {
    if (!pipelineRunListWatch.query.data) return [];

    return [...pipelineRunListWatch.data.array]
      .sort((a, b) => {
        const timeA = a.metadata.creationTimestamp ? new Date(a.metadata.creationTimestamp).getTime() : 0;
        const timeB = b.metadata.creationTimestamp ? new Date(b.metadata.creationTimestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, MAX_VISIBLE_RUNS);
  }, [pipelineRunListWatch.data.array, pipelineRunListWatch.query.data]);

  const isLoading = pipelineRunListWatch.query.isFetching && !pipelineRunListWatch.query.data;

  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-base font-medium">Recent Pipeline Activity</h2>
          <Link to={PATH_PIPELINERUNS_FULL} params={{ clusterName }}>
            <Button variant="ghost" size="sm" className="text-primary h-auto p-0 text-sm">
              View All
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">Loading...</span>
          </div>
        ) : recentRuns.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No pipeline runs found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">Pipeline Name</th>
                  <th className="text-muted-foreground px-3 py-2 text-center text-xs font-medium">Status</th>
                  <th className="text-muted-foreground px-3 py-2 text-center text-xs font-medium">Duration</th>
                  <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => {
                  const statusDisplay = getStatusDisplay(run);
                  const StatusIcon = statusDisplay.icon;
                  const duration = formatDurationFromTimestamps(run.status?.startTime, run.status?.completionTime);
                  const started = formatRelativeTime(run.metadata.creationTimestamp);

                  return (
                    <tr
                      key={run.metadata.uid}
                      className="hover:bg-muted/50 border-border/50 cursor-pointer border-b transition-colors last:border-b-0"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <GitCommit className="text-muted-foreground size-3.5 shrink-0" />
                          <span className="text-foreground truncate text-sm">{run.metadata.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center">
                          <Badge variant={statusDisplay.variant}>
                            <StatusIcon className="size-3" />
                            {statusDisplay.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-muted-foreground font-mono text-sm">{duration}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-muted-foreground text-sm">{started}</span>
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
