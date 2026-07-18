import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";
import type { NotificationListItem } from "@my-project/shared";
import { NotificationListRow } from "./index";

// The NotificationBell container is deliberately not storied: it owns the
// live WebSocket subscription singleton, which would open (and retry) a real
// connection inside Storybook. Row stories + the registry's Vitest suite
// cover it instead.

const baseNotification: NotificationListItem = {
  id: "evt-1",
  type: "pipelinerun.failed",
  severity: "error",
  title: "Build pipeline failed",
  body: "PipelineRun review-test-go-app-main-xyz failed in namespace krci",
  namespace: "krci",
  link: "/c/default/pipelineruns/review-test-go-app-main-xyz",
  timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  read: false,
};

const meta: Meta<typeof NotificationListRow> = {
  title: "Core/Components/NotificationListRow",
  component: NotificationListRow,
  args: { onOpen: fn() },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationListRow>;

export const UnreadWithLink: Story = {
  args: { notification: baseNotification },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Unread")).toBeVisible();
    canvas.getByRole("button").click();
    await expect(args.onOpen).toHaveBeenCalledWith(baseNotification);
  },
};

export const Read: Story = {
  args: { notification: { ...baseNotification, read: true } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByLabelText("Unread")).not.toBeInTheDocument();
  },
};

export const UnreadWithoutLinkMarksReadOnClick: Story = {
  args: { notification: { ...baseNotification, link: undefined } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button").click();
    await expect(args.onOpen).toHaveBeenCalledWith({ ...baseNotification, link: undefined });
  },
};

export const ReadWithoutLinkIsNotClickable: Story = {
  args: { notification: { ...baseNotification, link: undefined, read: true } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button")).not.toBeInTheDocument();
  },
};

export const SuccessSeverity: Story = {
  args: {
    notification: {
      ...baseNotification,
      severity: "success",
      title: "Build pipeline succeeded",
      body: "PipelineRun build-test-go-app-main-abc finished successfully in namespace krci",
      read: true,
    },
  },
};

export const LongBodyIsClamped: Story = {
  args: {
    notification: {
      ...baseNotification,
      body: "A very long notification body that goes on and on describing every detail of the failure including the task name, the step that failed, the exit code, and a suggestion for how to fix it — far more text than two lines can hold.",
    },
  },
};
