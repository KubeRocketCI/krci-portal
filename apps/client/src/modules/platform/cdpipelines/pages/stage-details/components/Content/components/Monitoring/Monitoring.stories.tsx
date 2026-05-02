import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricChart } from "./components/MetricChart";
import { Toolbar } from "./components/Toolbar";
import { RemoteClusterNotice } from "./components/RemoteClusterNotice";

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

export const FullTabWithData: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Toolbar
        range="1h"
        onRangeChange={() => {}}
        autoRefresh
        onAutoRefreshChange={() => {}}
        lastUpdatedAt={now}
        isStale={false}
      />
      <MetricChart
        title="CPU usage"
        unit="cores"
        isLoading={false}
        error={null}
        data={[
          { app: "frontend", series: series(0, 0.4) },
          { app: "api", series: series(1, 0.7) },
        ]}
      />
      <MetricChart
        title="Memory (working set)"
        unit="MiB"
        isLoading={false}
        error={null}
        data={[
          { app: "frontend", series: series(0, 200 * 1024 * 1024) },
          { app: "api", series: series(1, 350 * 1024 * 1024) },
        ]}
      />
      <MetricChart
        title="Container restarts"
        unit="count"
        isLoading={false}
        error={null}
        data={[
          {
            app: "frontend",
            series: [
              { t: now - 600, v: 0 },
              { t: now, v: 0 },
            ],
          },
          {
            app: "api",
            series: [
              { t: now - 600, v: 1 },
              { t: now, v: 2 },
            ],
          },
        ]}
      />
    </div>
  ),
};

export const FullTabRemoteCluster: StoryObj = {
  render: () => <RemoteClusterNotice />,
};
