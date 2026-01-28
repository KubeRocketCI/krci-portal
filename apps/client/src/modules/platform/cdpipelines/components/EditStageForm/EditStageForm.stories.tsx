import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { EditStageForm } from "./index";
import { withAppProviders } from "@sb/index";
import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import type { Stage } from "@my-project/shared";

const dialogDecorator = withAppProviders({
  contentWrapper: ({ children }) => (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[600px]">{children}</DialogContent>
    </Dialog>
  ),
});

const mockStage: Stage = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "Stage",
  metadata: {
    name: "dev",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
    labels: {
      "app.edp.epam.com/cdPipelineName": "my-pipeline",
    },
  },
  spec: {
    cdPipeline: "my-pipeline",
    clusterName: "in-cluster",
    name: "dev",
    namespace: "default",
    order: 1,
    qualityGates: [],
    triggerType: "Auto",
    triggerTemplate: "deploy-template",
    cleanTemplate: "clean-template",
  },
};

const meta = {
  title: "Platform/CDPipelines/EditStageForm",
  component: EditStageForm,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [dialogDecorator],
} satisfies Meta<typeof EditStageForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Form loaded with existing stage data. Apply and Undo Changes are disabled
 * because no fields have been modified yet.
 */
export const Default: Story = {
  args: {
    stage: mockStage,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Edit dev/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /apply/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /undo changes/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /cancel/i })).toBeEnabled();
  },
};

/**
 * Change the Trigger type select, then click Undo Changes to verify
 * the field resets back to its original value.
 */
export const UndoChanges: Story = {
  args: {
    stage: mockStage,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    // Open the Trigger type select and pick a different option
    const triggerTypeSelect = canvas.getByRole("combobox", { name: /trigger type/i });
    await userEvent.click(triggerTypeSelect);
    await userEvent.selectOptions(triggerTypeSelect, "Manual");

    // Undo Changes should now be enabled — click it
    const undoButton = canvas.getByRole("button", { name: /undo changes/i });
    await expect(undoButton).toBeEnabled();
    await userEvent.click(undoButton);

    // After reset, buttons go back to disabled
    await expect(canvas.getByRole("button", { name: /apply/i })).toBeDisabled();
    await expect(undoButton).toBeDisabled();
  },
};

/**
 * Change the Trigger type select and verify that the Apply button becomes enabled.
 */
export const ApplyEnabled: Story = {
  args: {
    stage: mockStage,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    const triggerTypeSelect = canvas.getByRole("combobox", { name: /trigger type/i });
    await userEvent.click(triggerTypeSelect);
    await userEvent.selectOptions(triggerTypeSelect, "Manual");

    await expect(canvas.getByRole("button", { name: /apply/i })).toBeEnabled();
  },
};
