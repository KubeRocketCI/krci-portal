import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { ManageGitServer } from "./index";
import { withAppProviders, mockPermissions, STORYBOOK_CLUSTER_NAME, STORYBOOK_NAMESPACE } from "@sb/index";
import type { GitServer } from "@my-project/shared";
import { k8sSecretConfig, k8sGitServerConfig } from "@my-project/shared";
import { getK8sItemPermissionsQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";

const manageGitServerDecorator = withAppProviders({
  seedQueryCache: (client) => {
    // Pre-seed permissions for Secret
    const secretPermissionsCacheKey = getK8sItemPermissionsQueryCacheKey(
      STORYBOOK_CLUSTER_NAME,
      STORYBOOK_NAMESPACE,
      k8sSecretConfig.pluralName
    );
    client.setQueryData(secretPermissionsCacheKey, mockPermissions);

    // Pre-seed permissions for GitServer
    const gitServerPermissionsCacheKey = getK8sItemPermissionsQueryCacheKey(
      STORYBOOK_CLUSTER_NAME,
      STORYBOOK_NAMESPACE,
      k8sGitServerConfig.pluralName
    );
    client.setQueryData(gitServerPermissionsCacheKey, mockPermissions);
  },
});

const meta = {
  title: "Platform/Configuration/GitServer/ManageGitServer",
  component: ManageGitServer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    manageGitServerDecorator,
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ManageGitServer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockGitServerGitHub: GitServer = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "GitServer",
  metadata: {
    name: "github",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  spec: {
    gitHost: "github.com",
    gitProvider: "github",
    gitUser: "git",
    httpsPort: 443,
    sshPort: 22,
    nameSshKeySecret: "github-sshkey",
    skipWebhookSSLVerification: false,
  },
  status: {},
};

const mockGitServerGitLab: GitServer = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "GitServer",
  metadata: {
    name: "gitlab",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  spec: {
    gitHost: "gitlab.com",
    gitProvider: "gitlab",
    gitUser: "git",
    httpsPort: 443,
    sshPort: 22,
    nameSshKeySecret: "gitlab-sshkey",
    skipWebhookSSLVerification: false,
  },
  status: {},
};

const mockGitServerGerrit: GitServer = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "GitServer",
  metadata: {
    name: "gerrit",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  spec: {
    gitHost: "gerrit.example.com",
    gitProvider: "gerrit",
    gitUser: "edp-ci",
    httpsPort: 443,
    sshPort: 29418,
    nameSshKeySecret: "gerrit-sshkey",
    skipWebhookSSLVerification: false,
  },
  status: {},
};

const mockGitServerWithWebhook: GitServer = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "GitServer",
  metadata: {
    name: "github-custom",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  spec: {
    gitHost: "github.enterprise.com",
    gitProvider: "github",
    gitUser: "git",
    httpsPort: 443,
    sshPort: 22,
    nameSshKeySecret: "github-custom-sshkey",
    skipWebhookSSLVerification: false,
    webhookUrl: "https://custom-webhook.example.com/webhook",
  },
  status: {},
};

/**
 * Create mode - New Git Server integration
 * Shows the form with no existing configuration, ready to create a new Git Server integration.
 */
export const CreateMode: Story = {
  args: {
    gitServer: undefined,
    webhookURL: "https://edp-webhook.example.com/webhook",
    handleClosePanel: () => alert("Close panel"),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("form")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /save/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  },
};

/**
 * Edit mode - GitHub configuration
 * Shows the form with an existing GitHub Git Server integration.
 * GitHub uses token-based authentication (SSH key + token).
 */
export const EditModeGitHub: Story = {
  args: {
    gitServer: mockGitServerGitHub,
    webhookURL: "https://edp-webhook.example.com/webhook",
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("form")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Host", { selector: "input" })).toHaveValue("github.com");
    await expect(canvas.getByLabelText("SSH port", { selector: "input" })).toHaveValue("22");
    await expect(canvas.getByLabelText("Token", { selector: "input" })).toBeInTheDocument();

    const saveButton = canvas.getByRole("button", { name: /save/i });
    const hostInput = canvas.getByLabelText("Host", { selector: "input" });
    await userEvent.clear(hostInput);
    await userEvent.type(hostInput, "github.enterprise.com");
    await expect(saveButton).toBeEnabled();

    await expect(canvas.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  },
};

/**
 * Edit mode - GitLab configuration
 * Shows the form with an existing GitLab Git Server integration.
 * GitLab uses token-based authentication similar to GitHub.
 */
export const EditModeGitLab: Story = {
  args: {
    gitServer: mockGitServerGitLab,
    webhookURL: "https://edp-webhook.example.com/webhook",
    handleClosePanel: undefined,
  },
};

/**
 * Edit mode - Gerrit configuration
 * Shows the form with an existing Gerrit Git Server integration.
 * Gerrit uses SSH key-based authentication (private + public keys only, no token).
 * Note the different SSH port (29418) which is typical for Gerrit.
 */
export const EditModeGerrit: Story = {
  args: {
    gitServer: mockGitServerGerrit,
    webhookURL: "https://edp-webhook.example.com/webhook",
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("form")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Host", { selector: "input" })).toHaveValue("gerrit.example.com");
    await expect(canvas.getByLabelText("SSH port", { selector: "input" })).toHaveValue("29418");
    await expect(canvas.getByLabelText("Public SSH key", { selector: "textarea" })).toBeInTheDocument();
    await expect(canvas.queryByLabelText("Token")).not.toBeInTheDocument();
  },
};

/**
 * Edit mode - With Custom Webhook URL
 * Shows the form with a custom webhook URL override.
 * This is useful when the default webhook URL needs to be customized.
 */
export const EditModeWithCustomWebhook: Story = {
  args: {
    gitServer: mockGitServerWithWebhook,
    webhookURL: "https://edp-webhook.example.com/webhook",
    handleClosePanel: undefined,
  },
};

/**
 * Edit mode - With External Owner
 * Shows the form when the Git Server has an external owner, which disables the Delete button.
 * This represents a scenario where the integration is managed by another resource.
 */
export const EditModeWithExternalOwner: Story = {
  args: {
    gitServer: {
      ...mockGitServerGitHub,
      metadata: {
        ...mockGitServerGitHub.metadata,
        ownerReferences: [
          {
            apiVersion: "v2.edp.epam.com/v1",
            kind: "EDPComponent",
            name: "git-server-component",
            uid: "12345-67890",
            blockOwnerDeletion: false,
            controller: false,
          },
        ],
      },
    },
    webhookURL: "https://edp-webhook.example.com/webhook",
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  },
};

/**
 * Edit mode - Undo Changes
 * Verifies that editing Host and clicking Undo resets the value.
 */
export const EditModeUndoChanges: Story = {
  name: "Edit Mode - Undo Changes",
  args: {
    gitServer: mockGitServerGitHub,
    webhookURL: "https://edp-webhook.example.com/webhook",
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    const hostInput = canvas.getByLabelText("Host", { selector: "input" });
    const originalValue = "github.com";
    await expect(hostInput).toHaveValue(originalValue);

    await userEvent.clear(hostInput);
    await userEvent.type(hostInput, "github.enterprise.com");

    const undoButton = canvas.getByRole("button", { name: /undo changes/i });
    await expect(undoButton).toBeEnabled();
    await userEvent.click(undoButton);

    await expect(hostInput).toHaveValue(originalValue);
  },
};

/**
 * Edit mode - Validation
 * Verifies validation on the Host field when cleared.
 */
export const EditModeValidation: Story = {
  name: "Edit Mode - Validation",
  args: {
    gitServer: mockGitServerGitHub,
    webhookURL: "https://edp-webhook.example.com/webhook",
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    const hostInput = canvas.getByLabelText("Host", { selector: "input" });
    await userEvent.clear(hostInput);
    await userEvent.tab();
    await expect(hostInput).toHaveValue("");
  },
};
