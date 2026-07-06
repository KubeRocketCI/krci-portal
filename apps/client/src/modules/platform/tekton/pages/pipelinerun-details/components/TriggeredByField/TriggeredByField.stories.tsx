import type { Meta, StoryObj } from "@storybook/react-vite";
import { TriggeredByField } from "./index";

const meta = {
  title: "Feature/PipelineRunDetails/TriggeredByField",
  component: TriggeredByField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TriggeredByField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Human: Story = {
  args: {
    triggeredBy: { actorClass: "human", actor: "dev@example.com", displayName: "dev@example.com" },
  },
};

export const Automation: Story = {
  args: {
    triggeredBy: {
      actorClass: "automation",
      actor: "system:serviceaccount:krci:krci-admin",
      displayName: "krci-admin",
    },
  },
};

/** Explicitly unresolved actor (never audited, system:unknown, or krci-audit unavailable). */
export const Unknown: Story = {
  args: {
    triggeredBy: { actorClass: "unknown" },
  },
};

export const Loading: Story = {
  args: {
    triggeredBy: undefined,
  },
};
