import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Toolbar } from "./index";

const meta = {
  title: "CDPipelines/StageDetails/Monitoring/Toolbar",
  component: Toolbar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

const apps = ["frontend", "api", "worker"];
const now = Math.floor(Date.now() / 1000);

function Wrap(initial: {
  range?: "5m" | "15m" | "1h" | "6h" | "24h";
  autoRefresh?: boolean;
  selectedApps?: string[] | null;
  isStale?: boolean;
}) {
  return function Component() {
    const [range, setRange] = React.useState<"5m" | "15m" | "1h" | "6h" | "24h">(initial.range ?? "1h");
    const [autoRefresh, setAutoRefresh] = React.useState<boolean>(initial.autoRefresh ?? true);
    const [selectedApps, setSelectedApps] = React.useState<string[] | null>(initial.selectedApps ?? null);
    return (
      <Toolbar
        range={range}
        onRangeChange={setRange}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        lastUpdatedAt={now}
        isStale={!!initial.isStale}
        selectedApps={selectedApps}
        availableApps={apps}
        onAppsChange={setSelectedApps}
        onAppsClear={() => setSelectedApps(null)}
      />
    );
  };
}

const defaultArgs = {
  range: "1h" as const,
  onRangeChange: () => {},
  autoRefresh: true,
  onAutoRefreshChange: () => {},
  lastUpdatedAt: now,
  isStale: false,
  selectedApps: null,
  availableApps: apps,
  onAppsChange: () => {},
  onAppsClear: () => {},
};

export const AllAppsDefault: Story = { args: defaultArgs, render: Wrap({}) };
export const FilteredOneApp: Story = {
  args: { ...defaultArgs, selectedApps: ["frontend"] },
  render: Wrap({ selectedApps: ["frontend"] }),
};
export const StaleRefresh: Story = { args: { ...defaultArgs, isStale: true }, render: Wrap({ isStale: true }) };
export const ManualRefresh: Story = {
  args: { ...defaultArgs, autoRefresh: false },
  render: Wrap({ autoRefresh: false }),
};
