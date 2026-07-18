import type { Meta, StoryObj } from "@storybook/react-vite";
import { NotificationSeverityIcon } from "./index";

const meta: Meta<typeof NotificationSeverityIcon> = {
  title: "Core/Components/NotificationSeverityIcon",
  component: NotificationSeverityIcon,
};

export default meta;
type Story = StoryObj<typeof NotificationSeverityIcon>;

export const Info: Story = {
  args: { severity: "info" },
};

export const Success: Story = {
  args: { severity: "success" },
};

export const Warning: Story = {
  args: { severity: "warning" },
};

export const Error: Story = {
  args: { severity: "error" },
};

export const AllSeverities: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <NotificationSeverityIcon severity="info" />
      <NotificationSeverityIcon severity="success" />
      <NotificationSeverityIcon severity="warning" />
      <NotificationSeverityIcon severity="error" />
    </div>
  ),
};
