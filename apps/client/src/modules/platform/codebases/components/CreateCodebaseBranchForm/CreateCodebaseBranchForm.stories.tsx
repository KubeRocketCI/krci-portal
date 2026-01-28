import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { CreateCodebaseBranchForm } from "./index";
import { withAppProviders } from "@sb/index";
import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import type { Codebase, CodebaseBranch } from "@my-project/shared";

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
      type: "default",
    },
  },
};

const mockCodebaseEdp: Codebase = {
  ...mockCodebase,
  spec: {
    ...mockCodebase.spec,
    versioning: {
      type: "edp",
      startFrom: "1.0.0",
    },
  },
};

const mockDefaultBranch: CodebaseBranch = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CodebaseBranch",
  metadata: {
    name: "my-application-main",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
    labels: {
      "app.edp.epam.com/codebaseName": "my-application",
    },
  },
  spec: {
    branchName: "main",
    codebaseName: "my-application",
    fromCommit: "",
    release: false,
    version: "1.0.0",
  },
  status: {
    value: "created",
    status: "created",
    action: "created",
    result: "success",
    username: "",
    failureCount: 0,
    lastTimeUpdated: "",
  },
};

const mockExistingBranches: CodebaseBranch[] = [
  mockDefaultBranch,
  {
    ...mockDefaultBranch,
    metadata: { ...mockDefaultBranch.metadata, name: "my-application-develop" },
    spec: { ...mockDefaultBranch.spec, branchName: "develop" },
  },
];

const mockPipelines = {
  review: "review-pipeline",
  build: "build-pipeline",
  security: "security-pipeline",
};

const meta = {
  title: "Platform/Codebases/CreateCodebaseBranchForm",
  component: CreateCodebaseBranchForm,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [dialogDecorator],
} satisfies Meta<typeof CreateCodebaseBranchForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default form state with a non-versioned codebase. The Release branch toggle
 * is not shown. Branch Name combobox is freeSolo — the gitfusion query will
 * return empty in Storybook but the field remains usable for typing. The
 * Create button is enabled (validation runs on click, not on change).
 */
export const Default: Story = {
  args: {
    codebase: mockCodebase,
    codebaseBranches: mockExistingBranches,
    defaultBranch: mockDefaultBranch,
    pipelines: mockPipelines,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Create branch for "my-application"/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /create/i })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: /cancel/i })).toBeEnabled();
  },
};

/**
 * Codebase uses EDP versioning and the default branch status is "created",
 * so the Release branch toggle is rendered. Versioning-related fields
 * (Branch version) are also visible.
 */
export const WithReleaseBranch: Story = {
  args: {
    codebase: mockCodebaseEdp,
    codebaseBranches: mockExistingBranches,
    defaultBranch: mockDefaultBranch,
    pipelines: mockPipelines,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Create branch for "my-application"/i)).toBeInTheDocument();
    // Release branch toggle should be visible
    await expect(canvas.getByLabelText(/release branch/i)).toBeInTheDocument();
    // Branch version field is shown for edp/semver versioning
    await expect(canvas.getByLabelText(/branch version/i)).toBeInTheDocument();
  },
};

/**
 * Type an existing branch name ("develop") into the Branch Name field, then
 * click Create to trigger manual validation. Verify that the duplicate-name
 * error message is shown.
 */
export const BranchNameValidation: Story = {
  args: {
    codebase: mockCodebase,
    codebaseBranches: mockExistingBranches,
    defaultBranch: mockDefaultBranch,
    pipelines: mockPipelines,
    onClose: () => {},
  },
  play: async ({ canvas }) => {
    const branchNameInput = canvas.getByLabelText(/branch name/i, { selector: "input" });
    await userEvent.type(branchNameInput, "develop");

    const createButton = canvas.getByRole("button", { name: /create/i });
    await userEvent.click(createButton);

    await expect(canvas.getByText(/Branch name "develop" already exists/i)).toBeInTheDocument();
  },
};
