export const SHARED_FORM_NAMES = {
  GIT_PROVIDER: "gitProvider",
  GIT_USER: "gitUser",
} as const;

export const GIT_SERVER_FORM_NAMES = {
  NAME: "name",
  GIT_HOST: "gitHost",
  GIT_PROVIDER: "gitProvider",
  GIT_USER: "gitUser",
  HTTPS_PORT: "httpsPort",
  NAME_SSH_KEY_SECRET: "nameSshKeySecret",
  SSH_PORT: "sshPort",
  SKIP_WEBHOOK_SSL: "skipWebhookSSLVerification",
  WEBHOOK_URL: "webhookURL",
  OVERRIDE_WEBHOOK_URL: "overrideWebhookURL",
} as const;

export const CREDENTIALS_FORM_NAMES = {
  SSH_PRIVATE_KEY: "sshPrivateKey",
  SSH_PUBLIC_KEY: "sshPublicKey",
  TOKEN: "token",
} as const;

export const GIT_SERVER_GERRIT_FORM_NAMES = {
  SSH_PRIVATE_KEY: "sshPrivateKey",
  SSH_PUBLIC_KEY: "sshPublicKey",
  GIT_USER: "gitUser",
} as const;

export const GIT_SERVER_GITHUB_FORM_NAMES = {
  SSH_PRIVATE_KEY: "sshPrivateKey",
  TOKEN: "token",
  GIT_USER: "gitUser",
} as const;

export const GIT_SERVER_GITLAB_FORM_NAMES = {
  SSH_PRIVATE_KEY: "sshPrivateKey",
  TOKEN: "token",
} as const;

export const GIT_SERVER_BITBUCKET_FORM_NAMES = {
  SSH_PRIVATE_KEY: "sshPrivateKey",
  TOKEN: "token",
} as const;
