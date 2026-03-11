import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { usePipelineMetrics } from "@/modules/platform/tekton/hooks/usePipelineMetrics";
import { usePipelineActivityChart } from "@/modules/platform/tekton/hooks/usePipelineActivityChart";
import { TIME_RANGES, PIPELINE_TYPES } from "@my-project/shared";
import { MAIN_COLOR, STATUS_COLOR } from "@/k8s/constants/colors";
import { routeOverviewDetails } from "../../route";
import { BarChart3, Loader2, Rocket, AlertTriangle } from "lucide-react";

export function DORAMetrics() {
  const { namespace } = routeOverviewDetails.useParams();

  const deployMetrics = usePipelineMetrics(namespace, {
    timeRange: TIME_RANGES.MONTH,
    pipelineType: PIPELINE_TYPES.DEPLOY,
  });

  const deployTrend = usePipelineActivityChart(namespace, {
    timeRange: TIME_RANGES.WEEK,
  });

  const totalDeploys = deployMetrics.data?.summary?.total ?? 0;
  const failedDeploys = deployMetrics.data?.summary?.failed ?? 0;
  const succeededDeploys = deployMetrics.data?.summary?.succeeded ?? 0;

  const changeFailureRate = totalDeploys > 0 ? Math.round((failedDeploys / totalDeploys) * 100) : null;

  const activeDays = deployTrend.data?.filter((d) => d.total > 0).length ?? 0;
  const totalDays = deployTrend.data?.length ?? 7;

  const isLoading = deployMetrics.isLoading;

  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4" style={{ color: MAIN_COLOR.BLUE }} />
            <h2 className="text-foreground text-base font-medium">DORA Metrics</h2>
          </div>
          <Badge variant="neutral">Last 30 days</Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">Loading...</span>
          </div>
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
                        changeFailureRate !== null && changeFailureRate > 15
                          ? STATUS_COLOR.ERROR
                          : STATUS_COLOR.SUCCESS,
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
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-gray-100">
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
      </CardContent>
    </Card>
  );
}
