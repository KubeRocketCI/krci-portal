import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { useClusterStore } from "@/k8s/store";
import { MAIN_COLOR } from "@/k8s/constants/colors";
import { Link } from "@tanstack/react-router";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { GitPullRequest, ExternalLink } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { DashboardCard } from "@/modules/platform/overview/components/DashboardCard";
import { LoadingState } from "@/modules/platform/overview/components/LoadingState";
import { EmptyState } from "@/modules/platform/overview/components/EmptyState";
import { useOpenPullRequestsSummary } from "@/modules/platform/overview/hooks/useOpenPullRequestsSummary";
import { formatRelativeTime } from "@/core/utils/date-humanize";

export function GitActivity() {
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const { data, isLoading, isError } = useOpenPullRequestsSummary();

  const repos = data?.repos ?? [];
  const totalOpen = data?.totalOpen ?? 0;

  return (
    <DashboardCard
      title="Git Activity"
      icon={GitPullRequest}
      iconColor={MAIN_COLOR.BLUE}
      badge={!isLoading && totalOpen > 0 ? <Badge variant="info">{totalOpen} open</Badge> : undefined}
    >
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <EmptyState message="Failed to load pull request data" />
      ) : repos.length === 0 ? (
        <EmptyState message="No pull request data available" />
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div key={repo.codebaseName} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <Link
                  to={PATH_PROJECT_DETAILS_FULL}
                  params={{ name: repo.codebaseName, namespace: defaultNamespace, clusterName }}
                >
                  <Button variant="link" className="text-foreground h-auto p-0 text-sm font-medium">
                    {repo.codebaseName}
                  </Button>
                </Link>
                <Badge variant={repo.openCount > 0 ? "info" : "neutral"}>{repo.openCount} open</Badge>
              </div>

              {repo.recentPRs.length > 0 ? (
                <div className="space-y-1">
                  {repo.recentPRs.map((pr) => (
                    <div key={pr.id} className="flex items-start justify-between gap-2 text-xs">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary flex items-center gap-1 hover:underline"
                        >
                          <span className="font-mono">#{pr.number}</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                        <span className="text-muted-foreground truncate">{pr.title}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0">{formatRelativeTime(pr.updatedAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No open pull requests</p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
