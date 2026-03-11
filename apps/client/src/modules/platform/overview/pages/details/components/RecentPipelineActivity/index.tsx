import { useMemo } from "react";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useClusterStore } from "@/k8s/store";
import { Link } from "@tanstack/react-router";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { ArrowRight, GitCommit } from "lucide-react";
import { LoadingState } from "@/modules/platform/overview/components/LoadingState";
import { DashboardCard } from "@/modules/platform/overview/components/DashboardCard";
import { useShallow } from "zustand/react/shallow";
import { formatDuration, formatRelativeTime } from "@/core/utils/date-humanize";
import { getStatusDisplay } from "../../utils/pipelineRunStatusDisplay";

const MAX_VISIBLE_RUNS = 6;

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
    <DashboardCard
      title="Recent Pipeline Activity"
      badge={
        <Link to={PATH_PIPELINERUNS_FULL} params={{ clusterName }}>
          <Button variant="ghost" size="sm" className="text-primary h-auto p-0 text-sm">
            View All
            <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <LoadingState className="py-8" />
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
                const duration = formatDuration(run.status?.startTime, run.status?.completionTime) ?? "-";
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
    </DashboardCard>
  );
}
