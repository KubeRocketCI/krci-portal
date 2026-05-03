import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { AppMultiSelect } from "./index";

const meta = {
  title: "CDPipelines/StageDetails/Monitoring/AppMultiSelect",
  component: AppMultiSelect,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof AppMultiSelect>;
export default meta;
type Story = StoryObj<typeof meta>;

const apps = ["frontend", "api", "worker", "scheduler"];

function Wrap(initial: string[] | null) {
  return function Component() {
    const [selected, setSelected] = React.useState<string[] | null>(initial);
    return (
      <AppMultiSelect
        selectedApps={selected}
        availableApps={apps}
        onChange={setSelected}
        onClear={() => setSelected(null)}
      />
    );
  };
}

export const AllApplications: Story = {
  args: { selectedApps: null, availableApps: apps, onChange: () => {}, onClear: () => {} },
  render: Wrap(null),
};
export const OneSelected: Story = {
  args: { selectedApps: ["frontend"], availableApps: apps, onChange: () => {}, onClear: () => {} },
  render: Wrap(["frontend"]),
};
export const SeveralSelected: Story = {
  args: { selectedApps: ["frontend", "api"], availableApps: apps, onChange: () => {}, onClear: () => {} },
  render: Wrap(["frontend", "api"]),
};
