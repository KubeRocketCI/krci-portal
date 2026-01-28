import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { ManageRegistry } from "./index";
import { withAppProviders, mockPermissions, STORYBOOK_CLUSTER_NAME, STORYBOOK_NAMESPACE } from "@sb/index";
import { containerRegistryType, k8sSecretConfig } from "@my-project/shared";
import type { ConfigMap, Secret, ServiceAccount } from "@my-project/shared";
import { getK8sItemPermissionsQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";

const manageRegistryDecorator = withAppProviders({
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
  title: "Platform/Configuration/Registry/ManageRegistry",
  component: ManageRegistry,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    manageRegistryDecorator,
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ManageRegistry>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockEDPConfigMapHarbor: ConfigMap = {
  apiVersion: "v1",
  kind: "ConfigMap",
  metadata: {
    name: "edp-config",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  data: {
    container_registry_type: containerRegistryType.harbor,
    container_registry_space: "my-project",
    container_registry_host: "harbor.example.com",
    platform: "kubernetes",
  },
};

const mockEDPConfigMapECR: ConfigMap = {
  apiVersion: "v1",
  kind: "ConfigMap",
  metadata: {
    name: "edp-config",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  data: {
    container_registry_type: containerRegistryType.ecr,
    container_registry_space: "my-project",
    aws_region: "us-east-1",
    platform: "kubernetes",
  },
};

const mockEDPConfigMapDockerHub: ConfigMap = {
  apiVersion: "v1",
  kind: "ConfigMap",
  metadata: {
    name: "edp-config",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  data: {
    container_registry_type: containerRegistryType.dockerhub,
    container_registry_space: "myorganization",
    container_registry_host: "docker.io",
    platform: "kubernetes",
  },
};

const mockPullAccountSecret: Secret = {
  apiVersion: "v1",
  kind: "Secret",
  metadata: {
    name: "regcred",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  type: "Opaque",
  data: {
    username: btoa("pull-user"),
    password: btoa("pull-password-secret"),
  },
};

const mockPushAccountSecret: Secret = {
  apiVersion: "v1",
  kind: "Secret",
  metadata: {
    name: "kaniko-docker-config",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
  },
  type: "Opaque",
  data: {
    username: btoa("push-user"),
    password: btoa("push-password-secret"),
  },
};

const mockServiceAccount: ServiceAccount = {
  apiVersion: "v1",
  kind: "ServiceAccount",
  metadata: {
    name: "tekton",
    namespace: "default",
    uid: "",
    creationTimestamp: "",
    annotations: {
      "eks.amazonaws.com/role-arn": "arn:aws:iam::123456789012:role/edp-ecr-role",
    },
  },
};

/**
 * Create mode - New registry integration
 * Shows the form with no existing configuration, ready to create a new container registry integration.
 */
export const CreateMode: Story = {
  args: {
    EDPConfigMap: undefined,
    pushAccountSecret: undefined,
    pullAccountSecret: undefined,
    tektonServiceAccount: undefined,
    handleCloseCreateDialog: () => alert("Close dialog"),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("form")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /save/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  },
};

/**
 * Edit mode - Harbor Registry
 * Shows the form with an existing Harbor registry configuration.
 * Harbor requires both push and pull account credentials.
 */
export const EditModeHarbor: Story = {
  args: {
    EDPConfigMap: mockEDPConfigMapHarbor,
    pushAccountSecret: mockPushAccountSecret,
    pullAccountSecret: mockPullAccountSecret,
    tektonServiceAccount: undefined,
    handleCloseCreateDialog: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("form")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Registry Space", { selector: "input" })).toHaveValue("my-project");
    await expect(canvas.getByRole("button", { name: /reset registry/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /undo changes/i })).toBeInTheDocument();

    const saveButton = canvas.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();

    const registrySpaceInput = canvas.getByLabelText("Registry Space", { selector: "input" });
    await userEvent.clear(registrySpaceInput);
    await userEvent.type(registrySpaceInput, "updated-space");
    await expect(saveButton).toBeEnabled();
  },
};

/**
 * Edit mode - ECR Registry
 * Shows the form with an existing AWS ECR configuration.
 * ECR uses IRSA (IAM Roles for Service Accounts) instead of credentials.
 */
export const EditModeECR: Story = {
  args: {
    EDPConfigMap: mockEDPConfigMapECR,
    pushAccountSecret: undefined,
    pullAccountSecret: mockPullAccountSecret,
    tektonServiceAccount: mockServiceAccount,
    handleCloseCreateDialog: undefined,
  },
};

/**
 * Edit mode - DockerHub Registry
 * Shows the form with an existing DockerHub configuration.
 * DockerHub requires both push and pull account credentials.
 */
export const EditModeDockerHub: Story = {
  args: {
    EDPConfigMap: mockEDPConfigMapDockerHub,
    pushAccountSecret: mockPushAccountSecret,
    pullAccountSecret: mockPullAccountSecret,
    tektonServiceAccount: undefined,
    handleCloseCreateDialog: undefined,
  },
};

/**
 * Edit mode - With External Owner
 * Shows the form when secrets have external owners, which disables the Reset Registry button.
 */
export const EditModeWithExternalOwner: Story = {
  args: {
    EDPConfigMap: mockEDPConfigMapHarbor,
    pushAccountSecret: {
      ...mockPushAccountSecret,
      metadata: {
        ...mockPushAccountSecret.metadata,
        ownerReferences: [
          {
            apiVersion: "v1",
            kind: "SomeOwner",
            name: "owner-resource",
            uid: "12345",
            blockOwnerDeletion: false,
            controller: false,
          },
        ],
      },
    },
    pullAccountSecret: mockPullAccountSecret,
    tektonServiceAccount: undefined,
    handleCloseCreateDialog: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /reset registry/i })).toBeDisabled();
  },
};

/**
 * Edit mode - Minimal Configuration
 * Shows the form with only required fields populated.
 */
export const EditModeMinimal: Story = {
  args: {
    EDPConfigMap: {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: {
        name: "edp-config",
        namespace: "default",
        uid: "",
        creationTimestamp: "",
      },
      data: {
        container_registry_type: containerRegistryType.nexus,
        container_registry_space: "docker-hosted",
        container_registry_host: "nexus.example.com:8082",
        platform: "kubernetes",
      },
    },
    pushAccountSecret: mockPushAccountSecret,
    pullAccountSecret: mockPullAccountSecret,
    tektonServiceAccount: undefined,
    handleCloseCreateDialog: undefined,
  },
};

/**
 * Edit mode - Undo Changes
 * Verifies that editing Registry Space and clicking Undo resets the value.
 */
export const EditModeUndoChanges: Story = {
  name: "Edit Mode - Undo Changes",
  args: {
    EDPConfigMap: mockEDPConfigMapHarbor,
    pushAccountSecret: mockPushAccountSecret,
    pullAccountSecret: mockPullAccountSecret,
    tektonServiceAccount: undefined,
    handleCloseCreateDialog: undefined,
  },
  play: async ({ canvas }) => {
    const registrySpaceInput = canvas.getByLabelText("Registry Space", { selector: "input" });
    const originalValue = "my-project";
    await expect(registrySpaceInput).toHaveValue(originalValue);

    await userEvent.clear(registrySpaceInput);
    await userEvent.type(registrySpaceInput, "updated-space");

    const undoButton = canvas.getByRole("button", { name: /undo changes/i });
    await expect(undoButton).toBeEnabled();
    await userEvent.click(undoButton);

    await expect(registrySpaceInput).toHaveValue(originalValue);
  },
};
