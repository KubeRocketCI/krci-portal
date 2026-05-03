import * as React from "react";
import { inClusterName, STEP_BY_RANGE, type DeploymentMetricsOutput, type MetricSeriesByApp } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { useStageWatch, usePipelineAppCodebasesWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { Toolbar } from "./components/Toolbar";
import { MetricChart } from "./components/MetricChart";
import { RemoteClusterNotice } from "./components/RemoteClusterNotice";
import { Section } from "./components/Section";
import { PodPhasePanel } from "./components/PodPhasePanel";
import { StatPanel } from "./components/StatPanel";
import { useDeploymentMetrics } from "./hooks/useDeploymentMetrics";
import { useMonitoringSearch } from "./hooks/useMonitoringSearch";
import { MetricsCursorProvider } from "./hooks/MetricsCursorProvider";
import type { MetricUnit } from "./types";
import { computeUtilization } from "./utils";

type ChartDef = {
  title: string;
  unit: MetricUnit;
  pick: (data: DeploymentMetricsOutput) => MetricSeriesByApp[];
};

type UtilisationDef = {
  title: string;
  usage: (data: DeploymentMetricsOutput) => MetricSeriesByApp[];
  capacity: (data: DeploymentMetricsOutput) => MetricSeriesByApp[];
};

const COMPUTE_CHARTS: ChartDef[] = [
  { title: "CPU usage", unit: "cores", pick: (d) => d.compute.cpu },
  { title: "CPU throttling", unit: "percent", pick: (d) => d.compute.cpuThrottling },
  { title: "Memory (working set)", unit: "MiB", pick: (d) => d.compute.memory },
  { title: "Memory RSS", unit: "MiB", pick: (d) => d.compute.memoryRss },
  { title: "Memory cache", unit: "MiB", pick: (d) => d.compute.memoryCache },
];
const NETWORK_CHARTS: ChartDef[] = [
  { title: "Network receive", unit: "bytes/s", pick: (d) => d.network.rx },
  { title: "Network transmit", unit: "bytes/s", pick: (d) => d.network.tx },
];
const STORAGE_CHARTS: ChartDef[] = [
  { title: "Disk read", unit: "bytes/s", pick: (d) => d.storage.readBytes },
  { title: "Disk write", unit: "bytes/s", pick: (d) => d.storage.writeBytes },
];
const HEALTH_CHARTS: ChartDef[] = [
  { title: "Container restarts", unit: "events", pick: (d) => d.health.restarts },
  { title: "OOM events", unit: "events", pick: (d) => d.health.oomEvents },
];
const UTILISATION_PANELS: UtilisationDef[] = [
  {
    title: "CPU Utilisation (from requests)",
    usage: (d) => d.compute.cpu,
    capacity: (d) => d.quotas.cpuRequests,
  },
  {
    title: "CPU Utilisation (from limits)",
    usage: (d) => d.compute.cpu,
    capacity: (d) => d.quotas.cpuLimits,
  },
  {
    title: "Memory Utilisation (from requests)",
    usage: (d) => d.compute.memory,
    capacity: (d) => d.quotas.memoryRequests,
  },
  {
    title: "Memory Utilisation (from limits)",
    usage: (d) => d.compute.memory,
    capacity: (d) => d.quotas.memoryLimits,
  },
];

export function Monitoring() {
  const params = routeStageDetails.useParams();
  const stageWatch = useStageWatch();
  const stage = stageWatch.query.data;
  const appCodebasesWatch = usePipelineAppCodebasesWatch();
  const {
    apps: filterApps,
    range,
    autoRefresh,
    setRange,
    setAutoRefresh,
    setApps,
    clearApps,
    toggleApp,
    isolateApp,
  } = useMonitoringSearch();

  const isRemoteCluster = stage !== undefined && stage.spec.clusterName !== inClusterName;

  const availableApps = React.useMemo(
    () => appCodebasesWatch.data.map((c) => c.metadata.name),
    [appCodebasesWatch.data]
  );

  // Resolved apps = filter intersected with available; null means "all available".
  const resolvedApps = React.useMemo(() => {
    if (filterApps === null) return availableApps;
    const set = new Set(availableApps);
    return filterApps.filter((a) => set.has(a));
  }, [filterApps, availableApps]);

  const selectedAppsSet = React.useMemo(() => new Set(resolvedApps), [resolvedApps]);

  const namespace = stage?.spec.namespace;

  const metrics = useDeploymentMetrics({
    clusterName: params.clusterName,
    namespace: namespace ?? "",
    applications: resolvedApps,
    range,
    autoRefresh,
    enabled: !!namespace && !isRemoteCluster && !appCodebasesWatch.isLoading && resolvedApps.length > 0,
  });

  const onLegendClick = React.useCallback(
    (app: string, modifiers: { toggle: boolean }) => {
      if (modifiers.toggle) toggleApp(app);
      else isolateApp(app);
    },
    [toggleApp, isolateApp]
  );

  // Memoised so MetricChart's React.memo isn't defeated by a fresh Error
  // reference on every render.
  const error = React.useMemo<Error | null>(() => {
    const errorObj = metrics.error as (Error & { data?: { code?: string } }) | null;
    if (!errorObj || metrics.data) return null;
    switch (errorObj.data?.code) {
      case "PRECONDITION_FAILED":
        return new Error("Metrics are not configured. Set PROMETHEUS_URL on the server.");
      case "GATEWAY_TIMEOUT":
        return new Error("Metrics query timed out. Try a shorter range.");
      case "BAD_GATEWAY":
        return new Error("Cannot reach Prometheus. Check that the metrics service is running.");
      default:
        return new Error(errorObj.message);
    }
  }, [metrics.error, metrics.data]);

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

  const data = metrics.data;
  const isLoading = metrics.isLoading;
  const isStale = data !== undefined && metrics.isError;

  if (!isLoading && !appCodebasesWatch.isLoading && availableApps.length === 0) {
    return (
      <Card className="p-6" data-tour="stage-monitoring">
        <h3 className="text-foreground mb-4 text-xl font-semibold">Monitoring</h3>
        <div className="text-muted-foreground text-sm">No applications deployed to this stage.</div>
      </Card>
    );
  }

  const step = STEP_BY_RANGE[range];
  const renderChart = (def: ChartDef) => (
    <MetricChart
      key={def.title}
      title={def.title}
      unit={def.unit}
      data={data ? def.pick(data) : []}
      isLoading={isLoading}
      error={error}
      onLegendClick={onLegendClick}
      step={step}
    />
  );
  const renderStat = (def: UtilisationDef) => (
    <StatPanel
      key={def.title}
      title={def.title}
      value={data ? computeUtilization(def.usage(data), def.capacity(data), selectedAppsSet) : null}
      isLoading={isLoading}
      error={error}
    />
  );

  return (
    <MetricsCursorProvider>
      <div className="space-y-6" data-tour="stage-monitoring">
        <Toolbar
          range={range}
          onRangeChange={setRange}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          lastUpdatedAt={data?.queriedAt}
          isStale={isStale}
          selectedApps={filterApps}
          availableApps={availableApps}
          onAppsChange={setApps}
          onAppsClear={clearApps}
        />

        <Section title="Utilisation">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{UTILISATION_PANELS.map(renderStat)}</div>
        </Section>

        <Section title="Compute" grid>
          {COMPUTE_CHARTS.map(renderChart)}
        </Section>

        <Section title="Network" grid>
          {NETWORK_CHARTS.map(renderChart)}
        </Section>

        <Section title="Storage" grid>
          {STORAGE_CHARTS.map(renderChart)}
        </Section>

        <Section title="Health">
          <div className="grid gap-3 md:grid-cols-2">{HEALTH_CHARTS.map(renderChart)}</div>
          <PodPhasePanel data={data?.health.podPhase ?? []} selectedApps={selectedAppsSet} />
        </Section>
      </div>
    </MetricsCursorProvider>
  );
}
