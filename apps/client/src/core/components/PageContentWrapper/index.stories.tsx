import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { Box, GitBranch, Info, Terminal } from "lucide-react";
import { withAppProviders } from "@sb/index";
import { PageContentWrapper } from "./index";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";

/**
 * Tab lifecycle: a tab mounts on first activation; a hidden tab keeps its state (typed text)
 * while its effects pause (the effect counter grows on every return); a persistent tab keeps
 * running while hidden (the counter stays at 1).
 */

function Panel({ name }: { name: string }) {
  const [effectRuns, setEffectRuns] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    setEffectRuns((runs) => runs + 1);
  }, []);

  return (
    <div className="space-y-3 p-4">
      <p className="text-sm">
        {name}: effect ran {effectRuns} time(s).
      </p>
      <input
        aria-label={`${name} text`}
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        placeholder="Type, switch tabs, come back"
        className="border-border w-80 rounded border px-2 py-1 text-sm"
      />
    </div>
  );
}

function LifecycleDemo({ persistentShell }: { persistentShell: boolean }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: <Info className="size-4" />, component: <Panel name="Overview" /> },
    { id: "branches", label: "Branches", icon: <GitBranch className="size-4" />, component: <Panel name="Branches" /> },
    {
      id: "shell",
      label: "Shell",
      icon: <Terminal className="size-4" />,
      persistent: persistentShell,
      component: <Panel name="Shell" />,
    },
  ];

  return (
    <PageContentWrapper
      icon={Box}
      title="lifecycle-demo"
      description="Switch tabs and watch the counters."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(_, idx) => setActiveTab(idx)}
    />
  );
}

const meta = {
  title: "Core/Components/PageContentWrapper",
  component: PageContentWrapper,
  decorators: [withAppProviders()],
} satisfies Meta<typeof PageContentWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithTabs: Story = {
  render: () => <LifecycleDemo persistentShell={false} />,
};

export const WithPersistentTab: Story = {
  render: () => <LifecycleDemo persistentShell />,
};
