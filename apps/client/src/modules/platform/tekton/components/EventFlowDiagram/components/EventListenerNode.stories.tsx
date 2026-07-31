import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactFlowProvider } from "@xyflow/react";
import { eventListenerSchema } from "@my-project/shared";
import { TriggerSelection } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { EventListenerNode } from "./EventListenerNode";

const eventListener = eventListenerSchema.parse({
  apiVersion: "triggers.tekton.dev/v1beta1",
  kind: "EventListener",
  metadata: {
    name: "github-listener",
    namespace: "edp-delivery",
    uid: "u-el",
    creationTimestamp: "2025-01-01T00:00:00Z",
  },
  spec: {},
});

const selection = (overrides: Partial<TriggerSelection> = {}): TriggerSelection => ({
  labelSelectorActive: false,
  terms: [],
  listedCount: 3,
  labelMatchedCount: 0,
  gaps: [],
  ...overrides,
});

const meta = {
  title: "Feature/EventFlowDiagram/EventListenerNode",
  component: EventListenerNode,
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
} satisfies Meta<typeof EventListenerNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  args: {
    data: {
      eventListener,
      ready: true,
      address: "http://el-github-listener.edp-delivery.svc:8080",
      triggerSelection: selection(),
    },
  },
};

export const Degraded: Story = {
  args: { data: { eventListener, ready: false, address: null, triggerSelection: selection() } },
};

/** Listed and label-matched Triggers are counted separately so the list view never disagrees. */
export const WithLabelMatchedTriggers: Story = {
  args: {
    data: {
      eventListener,
      ready: true,
      address: "http://el-github-listener.edp-delivery.svc:8080",
      triggerSelection: selection({ labelSelectorActive: true, terms: ["app=el"], labelMatchedCount: 2 }),
    },
  },
};

/** Every reason the rendered Trigger set may be narrower than what the sink serves. */
export const PartialView: Story = {
  args: {
    data: {
      eventListener,
      ready: true,
      address: null,
      triggerSelection: selection({
        labelSelectorActive: true,
        terms: ["app=el", "n Gt (3)"],
        gaps: [
          { kind: "triggersRestricted" },
          { kind: "unsupportedOperators", operators: ["Gt"] },
          { kind: "otherNamespaces", namespaces: ["*"] },
        ],
      }),
    },
  },
};
