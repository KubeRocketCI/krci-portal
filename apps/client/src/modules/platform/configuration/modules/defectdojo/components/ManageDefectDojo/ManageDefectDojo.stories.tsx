import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { ManageDefectDojo } from "./index";
import { withAppProviders, mockPermissions, STORYBOOK_CLUSTER_NAME, STORYBOOK_NAMESPACE } from "@sb/index";
import { FORM_MODES } from "@/core/types/forms";
import type { QuickLink, Secret } from "@my-project/shared";
import { k8sSecretConfig } from "@my-project/shared";
import { getK8sItemPermissionsQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";

const manageDefectDojoDecorator = withAppProviders({
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
  title: "Platform/Configuration/DefectDojo/ManageDefectDojo",
  component: ManageDefectDojo,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    manageDefectDojoDecorator,
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ManageDefectDojo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockQuickLink: QuickLink = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "QuickLink",
  metadata: {
    name: "defectdojo",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  spec: {
    type: "default",
    url: "https://defectdojo.example.com",
    icon: "defectdojo",
    visible: true,
  },
};

const mockSecret: Secret = {
  apiVersion: "v1",
  kind: "Secret",
  metadata: {
    name: "ci-defectdojo",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  type: "Opaque",
  data: {
    token: btoa("defectdojo_api_token_12345abcdef"),
    url: btoa("https://defectdojo-api.example.com"),
  },
};

/**
 * Create mode - New DefectDojo integration
 * Shows the form with no existing configuration, ready to create a new DefectDojo integration.
 * DefectDojo is a security vulnerability management and orchestration platform.
 */
export const CreateMode: Story = {
  args: {
    quickLink: undefined,
    secret: undefined,
    mode: FORM_MODES.CREATE,
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
 * Edit mode - Basic configuration
 * Shows the form with an existing DefectDojo integration.
 * Displays both QuickLink (external URL) and Secret (API token and URL) configuration.
 */
export const EditMode: Story = {
  args: {
    quickLink: mockQuickLink,
    secret: mockSecret,
    mode: FORM_MODES.EDIT,
    ownerReference: undefined,
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("form")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Quick Link URL", { selector: "input" })).toHaveValue(
      "https://defectdojo.example.com"
    );
    await expect(canvas.getByLabelText("URL", { selector: "input" })).toHaveValue("https://defectdojo-api.example.com");
    await expect(canvas.getByLabelText("Token", { selector: "input" })).toHaveValue("defectdojo_api_token_12345abcdef");

    const saveButton = canvas.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();

    const urlInput = canvas.getByLabelText("URL", { selector: "input" });
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, "https://new-url.example.com");
    await expect(saveButton).toBeEnabled();

    await expect(canvas.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  },
};

/**
 * Edit mode - With External Owner
 * Shows the form when the secret has an external owner, which disables the Delete button.
 * This represents a scenario where the integration is managed by another resource.
 */
export const EditModeWithExternalOwner: Story = {
  args: {
    quickLink: mockQuickLink,
    secret: {
      ...mockSecret,
      metadata: {
        ...mockSecret.metadata,
        ownerReferences: [
          {
            apiVersion: "v1",
            kind: "EDPComponent",
            name: "defectdojo-component",
            uid: "12345-67890",
            blockOwnerDeletion: false,
            controller: false,
          },
        ],
      },
    },
    mode: FORM_MODES.EDIT,
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
 * QuickLink is optional, so this demonstrates Secret-only configuration.
 */
export const EditModeMinimal: Story = {
  args: {
    quickLink: undefined,
    secret: mockSecret,
    mode: FORM_MODES.EDIT,
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
    quickLink: mockQuickLink,
    secret: mockSecret,
    mode: FORM_MODES.EDIT,
    ownerReference: undefined,
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    const urlInput = canvas.getByLabelText("URL", { selector: "input" });
    const originalValue = "https://defectdojo-api.example.com";
    await expect(urlInput).toHaveValue(originalValue);

    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, "https://changed.example.com");

    const undoButton = canvas.getByRole("button", { name: /undo changes/i });
    await expect(undoButton).toBeEnabled();
    await userEvent.click(undoButton);

    await expect(urlInput).toHaveValue(originalValue);
  },
};

/**
 * Edit mode - Validation
 * Verifies validation error messages on Quick Link URL field.
 */
export const EditModeValidation: Story = {
  name: "Edit Mode - Validation",
  args: {
    quickLink: mockQuickLink,
    secret: mockSecret,
    mode: FORM_MODES.EDIT,
    ownerReference: undefined,
    handleClosePanel: undefined,
  },
  play: async ({ canvas }) => {
    const quickLinkInput = canvas.getByLabelText("Quick Link URL", { selector: "input" });

    await userEvent.clear(quickLinkInput);
    await userEvent.tab();
    await expect(canvas.getByText("Enter the external DefectDojo URL.")).toBeInTheDocument();

    await userEvent.clear(quickLinkInput);
    await userEvent.type(quickLinkInput, "not-a-valid-url");
    await userEvent.tab();
    await expect(canvas.getByText("Enter a valid URL with HTTPS protocol.")).toBeInTheDocument();
  },
};
