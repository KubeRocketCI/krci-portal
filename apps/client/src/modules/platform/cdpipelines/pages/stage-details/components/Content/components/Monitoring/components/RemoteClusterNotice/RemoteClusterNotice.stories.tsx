import type { Meta, StoryObj } from "@storybook/react-vite";
import { RemoteClusterNotice } from "./index";

const meta = {
  title: "CDPipelines/StageDetails/Monitoring/RemoteClusterNotice",
  component: RemoteClusterNotice,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof RemoteClusterNotice>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
