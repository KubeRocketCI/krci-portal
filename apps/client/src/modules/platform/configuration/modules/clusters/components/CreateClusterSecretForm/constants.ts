import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const CLUSTER_FORM_NAMES = {
  CLUSTER_TYPE: "clusterType",
  CLUSTER_NAME: "clusterName",
  CLUSTER_HOST: "clusterHost",
  CLUSTER_CERTIFICATE: "clusterCertificate",
  CLUSTER_TOKEN: "clusterToken",
  SKIP_TLS_VERIFY: "skipTLSVerify",
  ROLE_ARN: "roleARN",
  CA_DATA: "caData",
} as const;

/**
 * FormGuide configuration for Cluster
 */
export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "clusterType",
      label: "Cluster Type",
      description:
        "Select the authentication type for this cluster. Choose IRSA for IAM Roles for Service Accounts (AWS EKS) or Bearer for token-based authentication.",
    },
    {
      fieldName: "clusterName",
      label: "Cluster Name",
      description: "A unique identifier for this cluster. Used internally and shown throughout the platform.",
    },
    {
      fieldName: "clusterHost",
      label: "Cluster Host",
      description:
        "Enter the API server endpoint URL for your Kubernetes cluster (e.g., https://api.cluster.example.com).",
    },
    {
      fieldName: "clusterToken",
      label: "Bearer Token",
      description:
        "Provide the bearer token for authenticating with the Kubernetes cluster. This token should have appropriate cluster permissions.",
      notes: ["The token is stored securely as a Kubernetes secret"],
      visibilityHint: "Visible when Cluster Type is Bearer",
    },
    {
      fieldName: "skipTLSVerify",
      label: "Skip TLS Verification",
      description:
        "Enable this to skip TLS certificate verification when connecting to the cluster. Not recommended for production environments.",
      notes: ["When disabled, you must provide a cluster certificate"],
      visibilityHint: "Visible when Cluster Type is Bearer",
    },
    {
      fieldName: "clusterCertificate",
      label: "Cluster Certificate",
      description:
        "Provide the Kubernetes CA certificate for secure TLS verification. This certificate is required when Skip TLS Verification is disabled.",
      notes: ["The certificate is stored securely as a Kubernetes secret"],
      visibilityHint: "Visible when Cluster Type is Bearer and Skip TLS Verification is disabled",
    },
    {
      fieldName: "caData",
      label: "CA Data",
      description:
        "Provide the Certificate Authority data for the cluster. This is used to verify the cluster's certificate when using IRSA authentication.",
      notes: ["The CA data is stored securely as a Kubernetes secret"],
      visibilityHint: "Visible when Cluster Type is IRSA",
    },
    {
      fieldName: "roleARN",
      label: "Role ARN",
      description:
        "Enter the AWS IAM Role ARN to assume for accessing this cluster. This role should have the necessary permissions for cluster operations.",
      notes: ["Format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME"],
      visibilityHint: "Visible when Cluster Type is IRSA",
    },
  ],
};
