import type { Meta, StoryObj } from "@storybook/react-vite";
import { k8sDeploymentConfig } from "@my-project/shared";
import { withAppProviders } from "@sb/index";
import { RestartAction } from "./index";

const meta = {
  title: "k8s/Actions/RestartAction",
  component: RestartAction,
  decorators: [withAppProviders()],
} satisfies Meta<typeof RestartAction>;
export default meta;

const item = {
  apiVersion: "apps/v1",
  kind: "Deployment",
  metadata: { name: "frontend", namespace: "default", uid: "1", creationTimestamp: "" },
};

export const Default: StoryObj<typeof RestartAction> = {
  args: { item, config: k8sDeploymentConfig },
};
