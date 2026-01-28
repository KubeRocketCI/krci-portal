import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { ManageJiraServer } from "./index";
import { withAppProviders, mockPermissions, STORYBOOK_CLUSTER_NAME, STORYBOOK_NAMESPACE } from "@sb/index";
import type { JiraServer, Secret } from "@my-project/shared";
import { k8sSecretConfig } from "@my-project/shared";
import { getK8sItemPermissionsQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";

const manageJiraServerDecorator = withAppProviders({
  seedQueryCache: (client) => {
    // Pre-seed permissions for Secret
    const secretPermissionsCacheKey = getK8sItemPermissionsQueryCacheKey(
      STORYBOOK_CLUSTER_NAME,
      STORYBOOK_NAMESPACE,
      k8sSecretConfig.pluralName
    );
    client.setQueryData(secretPermissionsCacheKey, mockPermissions);
  },
});

const meta = {
  title: "Platform/Configuration/Jira/ManageJiraServer",
  component: ManageJiraServer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    manageJiraServerDecorator,
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ManageJiraServer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockJiraServerCloud: JiraServer = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "JiraServer",
  metadata: {
    name: "jira-server",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  spec: {
    apiUrl: "https://mycompany.atlassian.net/rest/api/2",
    credentialName: "jira-server",
    rootUrl: "https://mycompany.atlassian.net",
  },
};

const mockJiraServerOnPremise: JiraServer = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "JiraServer",
  metadata: {
    name: "jira-server",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  spec: {
    apiUrl: "https://jira.example.com/rest/api/2",
    credentialName: "jira-server",
    rootUrl: "https://jira.example.com",
  },
};

const mockSecretWithPassword: Secret = {
  apiVersion: "v1",
  kind: "Secret",
  metadata: {
    name: "jira-server",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  type: "Opaque",
  data: {
    username: btoa("jira-admin"),
    password: btoa("jira-password-123"),
  },
};

const mockSecretWithToken: Secret = {
  apiVersion: "v1",
  kind: "Secret",
  metadata: {
    name: "jira-server",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  type: "Opaque",
  data: {
    username: btoa("admin@example.com"),
    password: btoa("ATATT3xFfGF0...jira-api-token"),
  },
};

/**
 * Create mode - New Jira Server integration
 * Shows the form with no existing configuration, ready to create a new Jira Server integration.
 * Note: Unlike other integrations, Jira does not use QuickLink - it only uses JiraServer and Secret resources.
 */
export const CreateMode: Story = {
  args: {
    jiraServer: undefined,
    secret: undefined,
    ownerReference: undefined,
    handleClosePanel: () => alert("Close panel"),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("form")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /save/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  },
};

/**
 * Edit mode - Jira Cloud with API Token
 * Shows the form with an existing Jira Cloud integration.
 * Jira Cloud (atlassian.net) uses email address and API token for authentication.
 * This is the recommended authentication method for cloud instances.
 */
export const EditModeJiraCloud: Story = {
  args: {
    jiraServer: mockJiraServerCloud,
    secret: mockSecretWithToken,
    ownerReference: undefined,
    handleClosePanel: undefined,
  },
};

/**
 * Edit mode - Jira Server On-Premise
 * Shows the form with an existing on-premise Jira Server integration.
 * Self-hosted Jira instances can use username/password or username/API token authentication.
 */
export const EditModeJiraOnPremise: Story = {
  args: {
    jiraServer: mockJiraServerOnPremise,
    secret: mockSecretWithPassword,
    ownerReference: undefined,
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("form")).toBeInTheDocument();
    await expect(canvas.getByLabelText("URL", { selector: "input" })).toHaveValue(
      "https://jira.example.com/rest/api/2"
    );
    await expect(canvas.getByLabelText("User", { selector: "input" })).toHaveValue("jira-admin");
    await expect(canvas.getByLabelText("Password", { selector: "input" })).toHaveValue("jira-password-123");

    const saveButton = canvas.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();

    const urlInput = canvas.getByLabelText("URL", { selector: "input" });
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, "https://new-jira.example.com/rest/api/2");
    await expect(saveButton).toBeEnabled();

    await expect(canvas.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  },
};

/**
 * Edit mode - With External Owner
 * Shows the form when the Jira Server has an external owner, which disables the Delete button.
 * This represents a scenario where the integration is managed by another resource.
 */
export const EditModeWithExternalOwner: Story = {
  args: {
    jiraServer: {
      ...mockJiraServerCloud,
      metadata: {
        ...mockJiraServerCloud.metadata,
        ownerReferences: [
          {
            apiVersion: "v2.edp.epam.com/v1",
            kind: "EDPComponent",
            name: "jira-component",
            uid: "12345-67890",
            blockOwnerDeletion: false,
            controller: false,
          },
        ],
      },
    },
    secret: mockSecretWithToken,
    ownerReference: "EDPComponent",
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /delete/i })).toBeDisabled();
  },
};

/**
 * Edit mode - Minimal configuration
 * Shows the form with only required fields populated.
 * Displays the minimum required configuration for a Jira integration.
 */
export const EditModeMinimal: Story = {
  args: {
    jiraServer: {
      apiVersion: "v2.edp.epam.com/v1",
      kind: "JiraServer",
      metadata: {
        name: "jira-server",
        namespace: "default",
        uid: "",
        creationTimestamp: "",
      },
      spec: {
        apiUrl: "https://jira.example.com/rest/api/2",
        credentialName: "jira-server",
        rootUrl: "",
      },
    },
    secret: mockSecretWithPassword,
    ownerReference: undefined,
    handleClosePanel: undefined,
  },
};

/**
 * Edit mode - Undo Changes
 * Verifies that editing a field and clicking Undo resets the value.
 */
export const EditModeUndoChanges: Story = {
  name: "Edit Mode - Undo Changes",
  args: {
    jiraServer: mockJiraServerOnPremise,
    secret: mockSecretWithPassword,
    ownerReference: undefined,
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    const urlInput = canvas.getByLabelText("URL", { selector: "input" });
    const originalValue = "https://jira.example.com/rest/api/2";
    await expect(urlInput).toHaveValue(originalValue);

    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, "https://changed-jira.example.com");

    const undoButton = canvas.getByRole("button", { name: /undo changes/i });
    await expect(undoButton).toBeEnabled();
    await userEvent.click(undoButton);

    await expect(urlInput).toHaveValue(originalValue);
  },
};

/**
 * Edit mode - Validation
 * Verifies validation error messages on URL, User, and Password fields.
 */
export const EditModeValidation: Story = {
  name: "Edit Mode - Validation",
  args: {
    jiraServer: mockJiraServerOnPremise,
    secret: mockSecretWithPassword,
    ownerReference: undefined,
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    const urlInput = canvas.getByLabelText("URL", { selector: "input" });
    await userEvent.clear(urlInput);
    await userEvent.tab();
    await expect(canvas.getByText("Enter Jira URL (e.g., https://your-jira-instance.com).")).toBeInTheDocument();

    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, "not-a-valid-url");
    await userEvent.tab();
    await expect(canvas.getByText("Enter a valid URL with HTTPS protocol.")).toBeInTheDocument();

    const userInput = canvas.getByLabelText("User", { selector: "input" });
    await userEvent.clear(userInput);
    await userEvent.tab();
    await expect(canvas.getByText("Enter your Jira username.")).toBeInTheDocument();

    const passwordInput = canvas.getByLabelText("Password", { selector: "input" });
    await userEvent.clear(passwordInput);
    await userEvent.tab();
    await expect(canvas.getByText("Enter your Jira password.")).toBeInTheDocument();
  },
};
