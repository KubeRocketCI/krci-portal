import { useMemo } from "react";
import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { useAuth } from "@/core/auth/provider";
import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useClusterStore } from "@/k8s/store";
import {
  getPipelineRunStatus,
  getPipelineRunAnnotation,
  tektonResultAnnotations,
  pipelineRunStatus,
  pipelineRunReason,
  type PipelineRun,
} from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { ArrowRight, User, CheckCircle2, XCircle, PlayCircle, Clock, Loader2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

const MAX_VISIBLE_RUNS = 5;

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

function matchesUser(run: PipelineRun, userName: string, userEmail: string): boolean {
  const author = getPipelineRunAnnotation(run, tektonResultAnnotations.gitAuthor);
  if (!author) return false;

  const authorLower = author.toLowerCase();
  return (
    authorLower === userName.toLowerCase() ||
    authorLower === userEmail.toLowerCase() ||
    authorLower === userEmail.split("@")[0]?.toLowerCase()
  );
}

export function MyRecentActivity() {
  const { user } = useAuth();
  const pipelineRunListWatch = usePipelineRunWatchList();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const myRuns = useMemo(() => {
    if (!pipelineRunListWatch.query.data || !user) return [];

    const userName = user.name || "";
    const userEmail = user.email || "";

    if (!userName && !userEmail) return [];

    return [...pipelineRunListWatch.data.array]
      .filter((run) => matchesUser(run, userName, userEmail))
      .sort((a, b) => {
        const timeA = a.metadata.creationTimestamp ? new Date(a.metadata.creationTimestamp).getTime() : 0;
        const timeB = b.metadata.creationTimestamp ? new Date(b.metadata.creationTimestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, MAX_VISIBLE_RUNS);
  }, [pipelineRunListWatch.data.array, pipelineRunListWatch.query.data, user]);

  const isLoading = pipelineRunListWatch.query.isFetching && !pipelineRunListWatch.query.data;

  if (!user) return null;

  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AuthorAvatar author={user.name || user.email} avatarUrl={user.picture} />
            <h2 className="text-foreground text-base font-medium">My Activity</h2>
          </div>
          <Link to={PATH_PIPELINERUNS_FULL} params={{ clusterName }}>
            <Button variant="ghost" size="sm" className="text-primary h-auto p-0 text-sm">
              View All
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">Loading...</span>
          </div>
        ) : myRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <User className="text-muted-foreground mb-2 size-8" />
            <p className="text-muted-foreground text-sm">No pipeline runs found for your account</p>
            <p className="text-muted-foreground text-xs">Runs triggered by you will appear here</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {myRuns.map((run) => {
              const statusDisplay = getStatusDisplay(run);
              const StatusIcon = statusDisplay.icon;
              const branch = getPipelineRunAnnotation(run, tektonResultAnnotations.gitBranch);
              const codebase = getPipelineRunAnnotation(run, tektonResultAnnotations.codebase);
              const started = formatRelativeTime(run.metadata.creationTimestamp);

              return (
                <div
                  key={run.metadata.uid}
                  className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-foreground truncate text-sm">{run.metadata.name}</span>
                      <Badge variant={statusDisplay.variant}>
                        <StatusIcon className="size-3" />
                        {statusDisplay.label}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs">
                      {codebase && <span className="text-muted-foreground">{codebase}</span>}
                      {branch && (
                        <>
                          {codebase && <span className="text-muted-foreground">&middot;</span>}
                          <span className="text-muted-foreground truncate">{branch}</span>
                        </>
                      )}
                      <span className="text-muted-foreground ml-auto shrink-0">{started}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
