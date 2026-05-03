import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { MetricChart } from "./components/MetricChart";
import { Toolbar } from "./components/Toolbar";
import { Section } from "./components/Section";
import { PodPhasePanel } from "./components/PodPhasePanel";
import { StatPanel } from "./components/StatPanel";
import { MetricsCursorProvider } from "./hooks/MetricsCursorProvider";
import { computeUtilization } from "./utils";

const meta: Meta = {
  title: "CDPipelines/StageDetails/Monitoring/Tab",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};
export default meta;

const now = Math.floor(Date.now() / 1000);
const series = (offset: number, scale: number) =>
  Array.from({ length: 30 }, (_, i) => ({
    t: now - (29 - i) * 60,
    v: scale * (1 + Math.sin(i / 4 + offset) * 0.4),
  }));

const apps = ["frontend", "api", "worker"];

function buildSeries(scale: number) {
  return apps.map((app, i) => ({ app, series: series(i, scale * (i + 1)) }));
}

const podPhase = [
  { app: "frontend", pods: [{ name: "frontend-7c9d4", phase: "Running" as const }] },
  { app: "api", pods: [{ name: "api-1", phase: "Running" as const }] },
  { app: "worker", pods: [{ name: "worker-1", phase: "Pending" as const }] },
];

function FullTab({ selected, emptyQuotas = false }: { selected: string[] | null; emptyQuotas?: boolean }) {
  const [range, setRange] = React.useState<"5m" | "15m" | "1h" | "6h" | "24h">("1h");
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [selectedApps, setSelectedApps] = React.useState<string[] | null>(selected);
  const set = React.useMemo(() => new Set(selectedApps ?? apps), [selectedApps]);
  const cpuUsage = buildSeries(0.3);
  const memUsage = buildSeries(64 * 1024 * 1024);
  const cpuRequests = emptyQuotas ? apps.map((app) => ({ app, series: [] })) : buildSeries(0.5);
  const cpuLimits = emptyQuotas ? apps.map((app) => ({ app, series: [] })) : buildSeries(1);
  const memRequests = emptyQuotas ? apps.map((app) => ({ app, series: [] })) : buildSeries(128 * 1024 * 1024);
  const memLimits = emptyQuotas ? apps.map((app) => ({ app, series: [] })) : buildSeries(256 * 1024 * 1024);
  const cpuThrottling = apps.map((app, i) => ({
    app,
    series: series(i * 2, 5 + i * 12).map((p) => ({ ...p, v: Math.max(0, p.v) })),
  }));
  return (
    <MetricsCursorProvider>
      <div className="space-y-6">
        <Toolbar
          range={range}
          onRangeChange={setRange}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          lastUpdatedAt={now}
          isStale={false}
          selectedApps={selectedApps}
          availableApps={apps}
          onAppsChange={setSelectedApps}
          onAppsClear={() => setSelectedApps(null)}
        />
        <Section title="Utilisation">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatPanel
              title="CPU Utilisation (from requests)"
              value={computeUtilization(cpuUsage, cpuRequests, set)}
              isLoading={false}
              error={null}
            />
            <StatPanel
              title="CPU Utilisation (from limits)"
              value={computeUtilization(cpuUsage, cpuLimits, set)}
              isLoading={false}
              error={null}
            />
            <StatPanel
              title="Memory Utilisation (from requests)"
              value={computeUtilization(memUsage, memRequests, set)}
              isLoading={false}
              error={null}
            />
            <StatPanel
              title="Memory Utilisation (from limits)"
              value={computeUtilization(memUsage, memLimits, set)}
              isLoading={false}
              error={null}
            />
          </div>
        </Section>
        <Section title="Compute" grid>
          <MetricChart
            title="CPU usage"
            unit="cores"
            data={cpuUsage}
            isLoading={false}
            error={null}
            selectedApps={set}
          />
          <MetricChart
            title="CPU throttling"
            unit="percent"
            data={cpuThrottling}
            isLoading={false}
            error={null}
            selectedApps={set}
          />
          <MetricChart
            title="Memory (working set)"
            unit="MiB"
            data={memUsage}
            isLoading={false}
            error={null}
            selectedApps={set}
          />
        </Section>
        <Section title="Network" grid>
          <MetricChart
            title="Network receive"
            unit="bytes/s"
            data={buildSeries(1024 * 256)}
            isLoading={false}
            error={null}
            selectedApps={set}
          />
          <MetricChart
            title="Network transmit"
            unit="bytes/s"
            data={buildSeries(1024 * 96)}
            isLoading={false}
            error={null}
            selectedApps={set}
          />
        </Section>
        <Section title="Health">
          <MetricChart
            title="Container restarts"
            unit="count"
            data={buildSeries(0).map((s) => ({ ...s, series: s.series.map((p) => ({ ...p, v: 0 })) }))}
            isLoading={false}
            error={null}
            selectedApps={set}
          />
          <PodPhasePanel data={podPhase} selectedApps={set} />
        </Section>
      </div>
    </MetricsCursorProvider>
  );
}

export const FullTabAllApps: StoryObj = { render: () => <FullTab selected={null} /> };
export const SingleAppIsolated: StoryObj = { render: () => <FullTab selected={["frontend"]} /> };
export const UtilisationNoData: StoryObj = { render: () => <FullTab selected={null} emptyQuotas /> };
