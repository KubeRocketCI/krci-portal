import { Badge } from "@/core/components/ui/badge";
import { usePipelineMetrics } from "@/modules/platform/tekton/hooks/usePipelineMetrics";
import { usePipelineActivityChart } from "@/modules/platform/tekton/hooks/usePipelineActivityChart";
import { TIME_RANGES, PIPELINE_TYPES } from "@my-project/shared";
import { MAIN_COLOR, STATUS_COLOR } from "@/k8s/constants/colors";
import { routeOverviewDetails } from "../../route";
import { BarChart3, Rocket, AlertTriangle } from "lucide-react";
import { LoadingState } from "@/modules/platform/overview/components/LoadingState";
import { DashboardCard } from "@/modules/platform/overview/components/DashboardCard";

export function DORAMetrics() {
  const { namespace } = routeOverviewDetails.useParams();

  const deployMetrics = usePipelineMetrics(namespace, {
    timeRange: TIME_RANGES.MONTH,
    pipelineType: PIPELINE_TYPES.DEPLOY,
    refetchInterval: 10 * 60_000,
  });

  const deployTrend = usePipelineActivityChart(namespace, {
    timeRange: TIME_RANGES.WEEK,
    refetchInterval: 5 * 60_000,
  });

  const totalDeploys = deployMetrics.data?.summary?.total ?? 0;
  const failedDeploys = deployMetrics.data?.summary?.failed ?? 0;
  const succeededDeploys = deployMetrics.data?.summary?.succeeded ?? 0;

  const changeFailureRate = totalDeploys > 0 ? Math.round((failedDeploys / totalDeploys) * 100) : null;

  const activeDays = deployTrend.data?.filter((d) => d.total > 0).length ?? 0;
  const totalDays = deployTrend.data?.length ?? 7;

  const isLoading = deployMetrics.isLoading;

  return (
    <DashboardCard
      title="DORA Metrics"
      icon={BarChart3}
      iconColor={MAIN_COLOR.BLUE}
      badge={<Badge variant="neutral">Last 30 days</Badge>}
    >
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm">
                <Rocket className="size-3.5" style={{ color: MAIN_COLOR.BLUE }} />
                <span className="text-muted-foreground">Deployment Frequency</span>
              </span>
              <Badge variant="info">
                {activeDays}/{totalDays} days
              </Badge>
            </div>
            <p className="text-foreground text-2xl">{totalDeploys}</p>
            <p className="text-muted-foreground text-xs">total deploys &middot; {succeededDeploys} succeeded</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm">
                <AlertTriangle
                  className="size-3.5"
                  style={{
                    color:
                      changeFailureRate !== null && changeFailureRate > 15 ? STATUS_COLOR.ERROR : STATUS_COLOR.SUCCESS,
                  }}
                />
                <span className="text-muted-foreground">Change Failure Rate</span>
              </span>
              {changeFailureRate !== null && (
                <Badge variant={changeFailureRate > 15 ? "error" : changeFailureRate > 0 ? "neutral" : "success"}>
                  {changeFailureRate > 15 ? "Needs attention" : changeFailureRate > 0 ? "Acceptable" : "Excellent"}
                </Badge>
              )}
            </div>
            <p className="text-foreground text-2xl">{changeFailureRate !== null ? `${changeFailureRate}%` : "-"}</p>
            <p className="text-muted-foreground text-xs">
              {failedDeploys} failed out of {totalDeploys} deploys
            </p>

            {totalDeploys > 0 && (
              <div className="bg-muted mt-2 flex h-1.5 overflow-hidden rounded-full">
                {succeededDeploys > 0 && (
                  <div
                    className="h-full"
                    style={{
                      width: `${(succeededDeploys / totalDeploys) * 100}%`,
                      backgroundColor: STATUS_COLOR.SUCCESS,
                    }}
                  />
                )}
                {failedDeploys > 0 && (
                  <div
                    className="h-full"
                    style={{
                      width: `${(failedDeploys / totalDeploys) * 100}%`,
                      backgroundColor: STATUS_COLOR.ERROR,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
