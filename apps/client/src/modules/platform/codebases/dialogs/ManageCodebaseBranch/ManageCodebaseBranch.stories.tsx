import type { Meta, StoryObj } from "@storybook/react-vite";
import { ManageCodebaseBranchDialog } from "./index";
import type { ManageCodebaseBranchDialogProps } from "./types";
import { codebaseVersioning, codebaseBranchStatus, type Codebase, type CodebaseBranch } from "@my-project/shared";
import { DialogContextProvider } from "@/core/providers/Dialog/provider";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { withAppProviders } from "@sb/index";

// Content wrapper that includes DialogContextProvider
const DialogContentWrapper: React.FC<{ children: React.ReactNode; args: Record<string, unknown> }> = ({ children }) => {
  return <DialogContextProvider>{children}</DialogContextProvider>;
};

// Create decorator with app providers and dialog context
const manageCodebaseBranchDecorator = withAppProviders({
  contentWrapper: DialogContentWrapper,
});

const meta = {
  title: "Platform/Codebases/Dialogs/ManageCodebaseBranch",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [manageCodebaseBranchDecorator],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockCodebase = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "Codebase",
  metadata: {
    name: "test-codebase",
    namespace: "edp-delivery-vp-dev",
  },
  spec: {
    type: "application",
    gitUrlPath: "/test-repo",
    gitServer: "github",
    defaultBranch: "main",
    versioning: {
      type: codebaseVersioning.edp,
    },
  },
} as unknown as Codebase;

const mockDefaultBranch = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CodebaseBranch",
  metadata: {
    name: "test-codebase-main",
    namespace: "edp-delivery-vp-dev",
  },
  spec: {
    branchName: "main",
    codebase: "test-codebase",
    version: "0.0.0-SNAPSHOT",
    release: false,
    pipelines: {
      build: "github-maven-java17-app-build-edp",
      review: "github-maven-java17-app-review-edp",
    },
  },
  status: {
    status: codebaseBranchStatus.created,
  },
} as unknown as CodebaseBranch;

const mockCodebaseBranches: CodebaseBranch[] = [
  mockDefaultBranch,
  {
    ...mockDefaultBranch,
    metadata: { ...mockDefaultBranch.metadata, name: "test-codebase-feature" },
    spec: { ...mockDefaultBranch.spec, branchName: "feature" },
  } as CodebaseBranch,
];

const mockPipelines = {
  build: "github-maven-java17-app-build-edp",
  review: "github-maven-java17-app-review-edp",
  security: "github-maven-java17-app-security-edp",
};

// Component wrapper to open dialog
const DialogTrigger: React.FC<{ props: ManageCodebaseBranchDialogProps["props"] }> = ({ props }) => {
  const openDialog = useDialogOpener(ManageCodebaseBranchDialog);

  return (
    <Button
      onClick={() =>
        openDialog({
          ...props,
        })
      }
    >
      Open Manage Codebase Branch Dialog
    </Button>
  );
};

export const Create: Story = {
  render: () => (
    <DialogTrigger
      props={{
        codebase: mockCodebase,
        defaultBranch: mockDefaultBranch,
        codebaseBranches: mockCodebaseBranches,
        pipelines: mockPipelines,
      }}
    />
  ),
};

export const Edit: Story = {
  render: () => (
    <DialogTrigger
      props={{
        codebase: mockCodebase,
        defaultBranch: mockDefaultBranch,
        codebaseBranches: mockCodebaseBranches,
        pipelines: mockPipelines,
        codebaseBranch: {
          ...mockDefaultBranch,
          metadata: { ...mockDefaultBranch.metadata, name: "test-codebase-feature" },
          spec: { ...mockDefaultBranch.spec, branchName: "feature" },
        } as CodebaseBranch,
      }}
    />
  ),
};

export const CreateWithSemverVersioning: Story = {
  render: () => (
    <DialogTrigger
      props={{
        codebase: {
          ...mockCodebase,
          spec: {
            ...mockCodebase.spec,
            versioning: {
              type: codebaseVersioning.semver,
            },
          },
        } as Codebase,
        defaultBranch: {
          ...mockDefaultBranch,
          spec: {
            ...mockDefaultBranch.spec,
            version: "1.0.0",
          },
        } as CodebaseBranch,
        codebaseBranches: mockCodebaseBranches,
        pipelines: mockPipelines,
      }}
    />
  ),
};
