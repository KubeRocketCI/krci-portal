import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

/**
 * FormGuide configuration for Container Registry
 */
export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "registryType",
      label: "Registry Type",
      description:
        "Select the container registry type. Supported types include ECR, Harbor, Nexus, OpenShift, Docker Hub, and GitHub Container Registry (GHCR).",
    },
    {
      fieldName: "registryEndpoint",
      label: "Registry Endpoint",
      description: "Enter the URL endpoint of your container registry (e.g., https://registry.example.com).",
    },
    {
      fieldName: "registrySpace",
      label: "Registry Space",
      description:
        "Enter the namespace or organization name in the registry where images will be stored (e.g., my-org or my-project).",
    },
    {
      fieldName: "awsRegion",
      label: "AWS Region",
      description: "Select the AWS region where your ECR registry is located (e.g., us-east-1, eu-west-1).",
      visibilityHint: "Visible when Registry Type is ECR",
    },
    {
      fieldName: "irsaRoleArn",
      label: "IRSA Role ARN",
      description: "Enter the AWS IAM Role ARN for IRSA (IAM Roles for Service Accounts) authentication with ECR.",
      notes: ["Format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME"],
      visibilityHint: "Visible when Registry Type is ECR",
    },
    {
      fieldName: "pushAccountUser",
      label: "Push Account Username",
      description: "Enter the username for pushing images to the registry. This account should have write permissions.",
      notes: ["The username is stored securely as a Kubernetes secret"],
      visibilityHint: "Visible when Registry Type is Harbor, Nexus, OpenShift, Docker Hub, or GHCR",
    },
    {
      fieldName: "pushAccountPassword",
      label: "Push Account Password",
      description:
        "Enter the password or token for the push account. For Docker Hub and GHCR, use a personal access token.",
      notes: ["The password is stored securely as a Kubernetes secret"],
      visibilityHint: "Visible when Registry Type is Harbor, Nexus, OpenShift, Docker Hub, or GHCR",
    },
    {
      fieldName: "useSameAccount",
      label: "Use Same Account for Pull",
      description:
        "Enable this to use the same credentials for both pushing and pulling images. When disabled, you can specify separate pull credentials.",
      visibilityHint: "Visible when Registry Type is Harbor, Nexus, Docker Hub, or GHCR",
    },
    {
      fieldName: "pullAccountUser",
      label: "Pull Account Username",
      description: "Enter the username for pulling images from the registry. This account needs read permissions.",
      notes: ["The username is stored securely as a Kubernetes secret", "Only used when Use Same Account is disabled"],
      visibilityHint: "Visible when Registry Type is Harbor, Nexus, Docker Hub, or GHCR",
    },
    {
      fieldName: "pullAccountPassword",
      label: "Pull Account Password",
      description: "Enter the password or token for the pull account.",
      notes: ["The password is stored securely as a Kubernetes secret", "Only used when Use Same Account is disabled"],
      visibilityHint: "Visible when Registry Type is Harbor, Nexus, Docker Hub, or GHCR",
    },
  ],
};
