import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactFlowProvider } from "@xyflow/react";
import { triggerSchema } from "@my-project/shared";
import { TriggerNode } from "./TriggerNode";

const resolved = triggerSchema.parse({
  apiVersion: "triggers.tekton.dev/v1beta1",
  kind: "Trigger",
  metadata: {
    name: "github-build",
    namespace: "edp-delivery",
    uid: "u-1",
    creationTimestamp: "2025-01-01T00:00:00Z",
    labels: { "app.edp.epam.com/gitServer": "github" },
  },
  spec: {},
});

const meta = {
  title: "Feature/EventFlowDiagram/TriggerNode",
  component: TriggerNode,
  parameters: { layout: "centered" },
  // Handle throws outside a ReactFlow store; the provider is the minimal host.
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <Story />
      </ReactFlowProvider>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof TriggerNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resolved: Story = {
  args: { data: { triggerRef: "github-build", resolved, status: "resolved", namespace: "edp-delivery" } },
};

export const Missing: Story = {
  args: { data: { triggerRef: "github-build", resolved: null, status: "missing", namespace: "edp-delivery" } },
};

/** The Trigger watch errored, so presence cannot be determined. */
export const Restricted: Story = {
  args: { data: { triggerRef: "github-build", resolved: null, status: "restricted", namespace: "edp-delivery" } },
};

/** Discovered through spec.labelSelector rather than spec.triggers. */
export const ViaLabelSelector: Story = {
  args: {
    data: {
      triggerRef: "github-build",
      resolved,
      status: "resolved",
      namespace: "edp-delivery",
      viaTerms: ["app.edp.epam.com/gitServer=github", "type in (build, review)"],
    },
  },
};

/** Both listed and label-matched — Tekton fires this Trigger twice per event. */
export const FiresTwice: Story = {
  args: {
    data: {
      triggerRef: "github-build",
      resolved,
      status: "resolved",
      namespace: "edp-delivery",
      firesTwice: true,
    },
  },
};
