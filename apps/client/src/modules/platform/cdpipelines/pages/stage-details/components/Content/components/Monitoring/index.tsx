import * as React from "react";
import { inClusterName } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { useStageWatch, usePipelineAppCodebasesWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { Toolbar } from "./components/Toolbar";
import { MetricChart } from "./components/MetricChart";
import { RemoteClusterNotice } from "./components/RemoteClusterNotice";
import { useDeploymentMetrics } from "./hooks/useDeploymentMetrics";
import { DEFAULT_AUTO_REFRESH, DEFAULT_RANGE } from "./constants";
import type { MetricRange } from "@my-project/shared";

export const Monitoring: React.FC = () => {
  const params = routeStageDetails.useParams();
  const stageWatch = useStageWatch();
  const stage = stageWatch.query.data;
  const appCodebasesWatch = usePipelineAppCodebasesWatch();

  const isRemoteCluster = stage !== undefined && stage.spec.clusterName !== inClusterName;

  const [range, setRange] = React.useState<MetricRange>(DEFAULT_RANGE);
  const [autoRefresh, setAutoRefresh] = React.useState<boolean>(DEFAULT_AUTO_REFRESH);

  const applications = React.useMemo(
    () => appCodebasesWatch.data.map((c) => c.metadata.name),
    [appCodebasesWatch.data]
  );

  const namespace = stage?.spec.namespace;

  const metrics = useDeploymentMetrics({
    clusterName: params.clusterName,
    namespace: namespace ?? "",
    applications,
    range,
    autoRefresh,
    enabled: !!namespace && !isRemoteCluster && !appCodebasesWatch.isLoading,
  });

  if (stageWatch.query.isLoading) {
    return (
      <Card className="p-6" data-tour="stage-monitoring">
        <h3 className="text-foreground mb-4 text-xl font-semibold">Monitoring</h3>
        <div className="text-muted-foreground text-sm">Loading…</div>
      </Card>
    );
  }

  if (isRemoteCluster) {
    return (
      <div data-tour="stage-monitoring">
        <RemoteClusterNotice />
      </div>
    );
  }

  const errorObj = metrics.error as (Error & { data?: { code?: string } }) | null;
  const errorCode = errorObj?.data?.code;
  const errorMessage = (() => {
    if (!errorObj) return null;
    switch (errorCode) {
      case "PRECONDITION_FAILED":
        return "Metrics are not configured. Set PROMETHEUS_URL on the server.";
      case "GATEWAY_TIMEOUT":
        return "Metrics query timed out. Try a shorter range.";
      case "BAD_GATEWAY":
        return "Cannot reach Prometheus. Check that the metrics service is running.";
      default:
        return errorObj.message;
    }
  })();

  const data = metrics.data;
  const isLoading = metrics.isLoading;

  // Suppress error in charts while keepPreviousData keeps the last successful
  // payload visible; the Toolbar's stale indicator communicates the failure.
  const error = errorMessage && !data ? new Error(errorMessage) : null;
  const isStale = data !== undefined && metrics.isError;

  if (!isLoading && !appCodebasesWatch.isLoading && applications.length === 0) {
    return (
      <Card className="p-6" data-tour="stage-monitoring">
        <h3 className="text-foreground mb-4 text-xl font-semibold">Monitoring</h3>
        <div className="text-muted-foreground text-sm">No applications deployed to this stage.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-tour="stage-monitoring">
      <Toolbar
        range={range}
        onRangeChange={setRange}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        lastUpdatedAt={data?.queriedAt}
        isStale={isStale}
      />
      <MetricChart title="CPU usage" unit="cores" data={data?.cpu ?? []} isLoading={isLoading} error={error} />
      <MetricChart
        title="Memory (working set)"
        unit="MiB"
        data={data?.memory ?? []}
        isLoading={isLoading}
        error={error}
      />
      <MetricChart
        title="Container restarts"
        unit="count"
        data={data?.restarts ?? []}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};
