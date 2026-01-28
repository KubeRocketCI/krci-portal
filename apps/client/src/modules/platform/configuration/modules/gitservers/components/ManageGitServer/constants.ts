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
  OVERRIDE_WEBHOOK_URL: "overrideWebhookURL",
  WEBHOOK_URL: "webhookURL",
  SSH_PRIVATE_KEY: "sshPrivateKey",
  SSH_PUBLIC_KEY: "sshPublicKey",
  TOKEN: "token",
} as const;
