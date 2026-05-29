import type { Meta, StoryObj } from "@storybook/react-vite";
import type { KubeObjectBase } from "@my-project/shared";
import { k8sDeploymentConfig } from "@my-project/shared";
import { withAppProviders } from "@sb/index";
import { ScaleAction } from "./index";
import { ScaleDialog } from "./ScaleDialog";

const meta = {
  title: "k8s/Actions/ScaleAction",
  component: ScaleAction,
  decorators: [withAppProviders()],
} satisfies Meta<typeof ScaleAction>;
export default meta;

const item = {
  apiVersion: "apps/v1",
  kind: "Deployment",
  metadata: { name: "frontend", namespace: "default", uid: "1", creationTimestamp: "" },
  spec: { replicas: 3 },
  status: { readyReplicas: 3, availableReplicas: 3 },
} as KubeObjectBase & { spec?: { replicas?: number }; status?: { readyReplicas?: number; availableReplicas?: number } };

const noopState = { open: true, openDialog: () => {}, closeDialog: () => {} };

export const ButtonOnly: StoryObj = {
  render: () => <ScaleAction item={item} config={k8sDeploymentConfig} />,
};

export const DialogOpenNoHpa: StoryObj = {
  render: () => <ScaleDialog props={{ item, config: k8sDeploymentConfig }} state={noopState} />,
};

export const DialogAtGuardrail: StoryObj = {
  parameters: {
    note: "Initial render has desired === current; raise the desired value above 100 (or above 4× current) in the UI to see the guardrail banner.",
  },
  render: () => {
    const big = { ...item, spec: { replicas: 5 } };
    return <ScaleDialog props={{ item: big, config: k8sDeploymentConfig }} state={noopState} />;
  },
};
