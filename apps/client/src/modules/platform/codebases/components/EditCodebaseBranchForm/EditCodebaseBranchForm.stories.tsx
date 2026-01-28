import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { EditCodebaseBranchForm } from "./index";
import { withAppProviders } from "@sb/index";
import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import type { CodebaseBranch } from "@my-project/shared";

const dialogDecorator = withAppProviders({
  contentWrapper: ({ children }) => (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[600px]">{children}</DialogContent>
    </Dialog>
  ),
});

const mockCodebaseBranch: CodebaseBranch = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CodebaseBranch",
  metadata: {
    name: "my-application-develop",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
    labels: {
      "app.edp.epam.com/codebaseName": "my-application",
    },
  },
  spec: {
    branchName: "develop",
    codebaseName: "my-application",
    fromCommit: "main",
    release: false,
    pipelines: {
      build: "build-pipeline",
      review: "review-pipeline",
      security: "security-pipeline",
    },
  },
};

const meta = {
  title: "Platform/Codebases/EditCodebaseBranchForm",
  component: EditCodebaseBranchForm,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [dialogDecorator],
} satisfies Meta<typeof EditCodebaseBranchForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Form loaded with existing codebase branch data. Pipeline comboboxes display
 * their current values as text but the options dropdown will be empty because
 * usePipelineWatchList returns no data in Storybook. Apply and Undo Changes
 * are disabled because no fields have been modified.
 */
export const Default: Story = {
  args: {
    codebaseBranch: mockCodebaseBranch,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Edit develop/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /apply/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /undo changes/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /cancel/i })).toBeEnabled();
  },
};

/**
 * When isProtected is true, both Apply and Undo Changes are disabled
 * and Apply is wrapped in a tooltip explaining the protection.
 */
export const Protected: Story = {
  args: {
    codebaseBranch: mockCodebaseBranch,
    onClose: () => {},
    isProtected: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Edit develop/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /apply/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /undo changes/i })).toBeDisabled();
  },
};
