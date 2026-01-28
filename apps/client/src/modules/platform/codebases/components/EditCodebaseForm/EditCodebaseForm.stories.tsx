import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { EditCodebaseForm } from "./index";
import { withAppProviders } from "@sb/index";
import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import type { Codebase } from "@my-project/shared";

const dialogDecorator = withAppProviders({
  contentWrapper: ({ children }) => (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[600px]">{children}</DialogContent>
    </Dialog>
  ),
});

const mockCodebase: Codebase = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "Codebase",
  metadata: {
    name: "my-application",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
    labels: {
      "app.edp.epam.com/codebaseType": "application",
    },
  },
  spec: {
    type: "application",
    buildTool: "gradle",
    ciTool: "tekton",
    framework: "spring",
    lang: "Java",
    defaultBranch: "main",
    gitServer: "github",
    gitUrlPath: "my-org/my-application",
    deploymentScript: "helm-chart",
    emptyProject: false,
    private: false,
    repository: null,
    strategy: "create",
    versioning: {
      type: "edp",
      startFrom: "0.1.0",
    },
    commitMessagePattern: "^(feat|fix|docs|style|refactor|test|chore): .*",
  },
};

const meta = {
  title: "Platform/Codebases/EditCodebaseForm",
  component: EditCodebaseForm,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [dialogDecorator],
} satisfies Meta<typeof EditCodebaseForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Form loaded with existing codebase data. The commit message pattern field
 * is pre-populated. Apply and Undo Changes are disabled because no changes
 * have been made. The Jira server switch is disabled because no Jira servers
 * are available in the watch list.
 */
export const Default: Story = {
  args: {
    codebase: mockCodebase,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Edit my-application/i)).toBeInTheDocument();

    const commitPatternInput = canvas.getByLabelText(/Specify the pattern to validate a commit message/i, {
      selector: "input",
    });
    await expect(commitPatternInput).toHaveValue("^(feat|fix|docs|style|refactor|test|chore): .*");

    await expect(canvas.getByRole("button", { name: /apply/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /undo changes/i })).toBeDisabled();
  },
};

/**
 * Change the commit message pattern, then click Undo Changes to verify
 * the field resets to its original value.
 */
export const UndoChanges: Story = {
  args: {
    codebase: mockCodebase,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    const commitPatternInput = canvas.getByLabelText(/Specify the pattern to validate a commit message/i, {
      selector: "input",
    });
    const originalValue = "^(feat|fix|docs|style|refactor|test|chore): .*";

    await userEvent.clear(commitPatternInput);
    await userEvent.type(commitPatternInput, "^TICKET-\\d+: .*");

    const undoButton = canvas.getByRole("button", { name: /undo changes/i });
    await expect(undoButton).toBeEnabled();
    await userEvent.click(undoButton);

    await expect(commitPatternInput).toHaveValue(originalValue);
    await expect(undoButton).toBeDisabled();
  },
};

/**
 * When isProtected is true, both Apply and Undo Changes buttons are disabled
 * regardless of form state. Apply is wrapped in a tooltip explaining the
 * protection.
 */
export const Protected: Story = {
  args: {
    codebase: mockCodebase,
    onClose: () => {},
    isProtected: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /apply/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /undo changes/i })).toBeDisabled();
  },
};

/**
 * Change the commit message pattern and verify that the Apply button
 * becomes enabled.
 */
export const ApplyEnabled: Story = {
  args: {
    codebase: mockCodebase,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    const commitPatternInput = canvas.getByLabelText(/Specify the pattern to validate a commit message/i, {
      selector: "input",
    });

    await userEvent.clear(commitPatternInput);
    await userEvent.type(commitPatternInput, "^TICKET-\\d+: .*");

    await expect(canvas.getByRole("button", { name: /apply/i })).toBeEnabled();
  },
};
