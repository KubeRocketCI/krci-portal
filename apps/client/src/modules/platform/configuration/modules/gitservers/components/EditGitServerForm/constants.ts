import type { FormGuideFieldDescription } from "@/core/providers/FormGuide/types";

export const FORM_NAMES = {
  SHARED: "shared",
  GIT_SERVER: "gitServer",
  CREDENTIALS: "credentials",
} as const;

export const NAMES = {
  NAME: "name",
  GIT_HOST: "gitHost",
  GIT_PROVIDER: "gitProvider",
  GIT_USER: "gitUser",
  NAME_SSH_KEY_SECRET: "nameSshKeySecret",
  SSH_PORT: "sshPort",
  HTTPS_PORT: "httpsPort",
  SKIP_WEBHOOK_SSL: "skipWebhookSSLVerification",
  TEKTON_DISABLED: "tektonDisabled",
  OVERRIDE_WEBHOOK_URL: "overrideWebhookURL",
  WEBHOOK_URL: "webhookURL",
  SSH_PRIVATE_KEY: "sshPrivateKey",
  SSH_PUBLIC_KEY: "sshPublicKey",
  TOKEN: "token",
} as const;

export const FORM_GUIDE_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  0: [
    {
      fieldName: "gitProvider",
      label: "Git Provider",
      description:
        "Select the Git provider for this server (GitHub, GitLab, Gerrit, or Bitbucket). This determines the authentication method and available features.",
    },
    {
      fieldName: "name",
      label: "Name",
      description: "A unique identifier for this Git server. Used internally and shown throughout the platform.",
    },
    {
      fieldName: "gitHost",
      label: "Host Name",
      description: "Enter the hostname or IP address of your Git server (e.g., github.com, gitlab.example.com).",
    },
    {
      fieldName: "gitUser",
      label: "User Name",
      description: "Enter the Git username for authentication. This user will be used for Git operations.",
    },
    {
      fieldName: "sshPort",
      label: "SSH Port",
      description: "Enter the SSH port for Git operations. Default is typically 22.",
    },
    {
      fieldName: "httpsPort",
      label: "HTTPS Port",
      description: "Enter the HTTPS port for Git operations. Default is typically 443.",
    },
    {
      fieldName: "overrideWebhookURL",
      label: "Override Webhook URL",
      description:
        "Enable this to specify a custom webhook URL. When enabled, you can provide a specific URL for webhook callbacks.",
    },
    {
      fieldName: "webhookURL",
      label: "Webhook URL",
      description:
        "Enter the custom webhook URL for this Git server. This is used for webhook callbacks from the Git provider.",
      visibilityHint: "Visible when Override Webhook URL is enabled",
    },
    {
      fieldName: "skipWebhookSSLVerification",
      label: "Skip Webhook SSL Verification",
      description:
        "Enable this to skip SSL certificate verification for webhooks. Use only in development or with self-signed certificates.",
      notes: ["Not recommended for production environments"],
    },
    {
      fieldName: "tektonDisabled",
      label: "Disable Tekton Integration",
      description: "Enable this to disable Tekton pipeline integration for this Git server.",
    },
    {
      fieldName: "sshPrivateKey",
      label: "SSH Private Key",
      description:
        "Provide the SSH private key for authentication with the Git server. This key is used for Git clone/push operations.",
      notes: ["The private key is stored securely as a Kubernetes secret"],
    },
    {
      fieldName: "sshPublicKey",
      label: "SSH Public Key",
      description: "Provide the SSH public key matching the private key. Required for Gerrit authentication.",
      notes: ["The public key is stored securely as a Kubernetes secret"],
      visibilityHint: "Visible when Git Provider is Gerrit",
    },
    {
      fieldName: "token",
      label: "Token",
      description:
        "Provide an access token for API authentication. Required for GitHub, GitLab, and Bitbucket providers.",
      notes: ["The token is stored securely as a Kubernetes secret"],
      visibilityHint: "Visible when Git Provider is GitHub, GitLab, or Bitbucket",
    },
  ],
};
