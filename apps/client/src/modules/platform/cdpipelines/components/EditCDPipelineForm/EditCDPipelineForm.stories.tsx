import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { EditCDPipelineForm } from "./index";
import { withAppProviders } from "@sb/index";
import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import type { CDPipeline } from "@my-project/shared";

const dialogDecorator = withAppProviders({
  contentWrapper: ({ children }) => (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[600px]">{children}</DialogContent>
    </Dialog>
  ),
});

const mockCDPipeline: CDPipeline = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CDPipeline",
  metadata: {
    name: "my-pipeline",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  spec: {
    name: "my-pipeline",
    deploymentType: "container",
    description: "Main deployment pipeline for the project",
    applications: ["app1", "app2"],
    inputDockerStreams: ["main", "develop"],
    applicationsToPromote: ["app1"],
  },
};

const mockCDPipelineWithMisalignedArrays: CDPipeline = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CDPipeline",
  metadata: {
    name: "test-pipeline",
    namespace: "default",
    uid: "test-uid-123",
    creationTimestamp: "2026-04-10T10:00:00Z",
  },
  spec: {
    name: "test-pipeline",
    deploymentType: "container",
    description: "Test pipeline with misaligned applications and branches",
    // Applications in one order
    applications: ["frontend-app", "backend-api", "database-service", "cache-service", "auth-service"],
    // Branches in different order (misaligned)
    inputDockerStreams: [
      "cache-service-main",
      "frontend-app-develop",
      "auth-service-feature-oauth",
      "database-service-hotfix-123",
      "backend-api-main",
    ],
    applicationsToPromote: ["frontend-app", "backend-api"],
  },
  status: {
    action: "setup_initial_structure",
    available: true,
    last_time_updated: "2026-04-10T10:00:00Z",
    result: "success",
    status: "created",
    username: "system",
    value: "active",
  },
};

const meta = {
  title: "Platform/CDPipelines/EditCDPipelineForm",
  component: EditCDPipelineForm,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [dialogDecorator],
} satisfies Meta<typeof EditCDPipelineForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Form loaded with existing CD pipeline data. Description is pre-populated.
 * Apply and Undo Changes are disabled because no fields have been modified.
 */
export const Default: Story = {
  args: {
    cdPipeline: mockCDPipeline,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Edit my-pipeline/i)).toBeInTheDocument();

    const descriptionTextarea = await canvas.findByLabelText("Description", { selector: "textarea" });
    await expect(descriptionTextarea).toHaveValue("Main deployment pipeline for the project");

    await expect(canvas.getByRole("button", { name: /apply/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /undo changes/i })).toBeDisabled();
  },
};

/**
 * Clear the Description, type a new value, then click Undo Changes to verify
 * the original description is restored.
 */
export const UndoChanges: Story = {
  args: {
    cdPipeline: mockCDPipeline,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    const descriptionTextarea = await canvas.findByLabelText("Description", { selector: "textarea" });
    const originalValue = "Main deployment pipeline for the project";

    await userEvent.clear(descriptionTextarea);
    await userEvent.type(descriptionTextarea, "Temporary description");

    const undoButton = canvas.getByRole("button", { name: /undo changes/i });
    await expect(undoButton).toBeEnabled();
    await userEvent.click(undoButton);

    await expect(descriptionTextarea).toHaveValue(originalValue);
    await expect(undoButton).toBeDisabled();
  },
};

/**
 * Clear the Description field and tab out to trigger the onChange validator.
 * Verifies that the "Description is required" error message is displayed.
 */
export const ValidationRequired: Story = {
  args: {
    cdPipeline: mockCDPipeline,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    const descriptionTextarea = await canvas.findByLabelText("Description", { selector: "textarea" });

    await userEvent.clear(descriptionTextarea);
    await userEvent.tab();

    await expect(canvas.getByText("Description is required")).toBeInTheDocument();
  },
};

/**
 * CDPipeline with misaligned applications and inputDockerStreams arrays.
 * Tests that the form correctly matches branches to apps using substring matching,
 * not index-based mapping. Should show no changes on initial load despite the
 * misalignment in the original resource.
 */
export const MisalignedArrays: Story = {
  args: {
    cdPipeline: mockCDPipelineWithMisalignedArrays,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Edit test-pipeline/i)).toBeInTheDocument();

    const descriptionTextarea = await canvas.findByLabelText("Description", { selector: "textarea" });
    await expect(descriptionTextarea).toHaveValue("Test pipeline with misaligned applications and branches");

    // Apply and Undo Changes should be disabled because no fields have been modified
    // even though the original arrays are misaligned
    await expect(canvas.getByRole("button", { name: /apply/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /undo changes/i })).toBeDisabled();
  },
};
