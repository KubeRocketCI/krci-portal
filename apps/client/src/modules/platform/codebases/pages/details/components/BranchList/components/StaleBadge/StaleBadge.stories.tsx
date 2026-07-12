import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import type { CodebaseBranch } from "@my-project/shared";
import { StaleBadge } from "./index";

const baseBranch: CodebaseBranch = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CodebaseBranch",
  metadata: {
    name: "my-application-feature-x",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
    labels: {
      "app.edp.epam.com/codebaseName": "my-application",
    },
  },
  spec: {
    branchName: "feature-x",
    codebaseName: "my-application",
    fromCommit: "",
    release: false,
  },
};

const staleBranch: CodebaseBranch = {
  ...baseBranch,
  metadata: {
    ...baseBranch.metadata,
    labels: {
      ...baseBranch.metadata.labels,
      "app.edp.epam.com/stale": "true",
    },
  },
  status: {
    action: "codebase_branch_registration",
    failureCount: 0,
    lastTimeUpdated: "2026-07-12T00:00:00Z",
    result: "success",
    status: "created",
    username: "system",
    value: "active",
    conditions: [
      {
        type: "Stale",
        status: "True",
        reason: "BranchNotFoundInGit",
        message: "Branch was not found in the git repository",
      },
    ],
  },
};

const meta: Meta<typeof StaleBadge> = {
  title: "Platform/Codebases/StaleBadge",
  component: StaleBadge,
};

export default meta;
type Story = StoryObj<typeof StaleBadge>;

export const HealthyBranchRendersNothing: Story = {
  args: { codebaseBranch: baseBranch },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText("Stale")).not.toBeInTheDocument();
  },
};

export const StaleWithConditionMessage: Story = {
  args: { codebaseBranch: staleBranch },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Stale")).toBeVisible();
  },
};

export const StaleByLabelOnly: Story = {
  args: {
    codebaseBranch: {
      ...baseBranch,
      metadata: staleBranch.metadata,
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Stale")).toBeVisible();
  },
};
