/** Actor template env entries that the recorded fixtures must not hold, by value. */
export const CHECKED_ENV: readonly string[] = ["SESSION_ID", "GITLAB_URL", "BOT_USERNAME"];

/** IPv4, `*.svc`, `*.cluster.local` and nip.io host names. */
export const IN_CLUSTER_ADDRESS = /\b\d{1,3}(\.\d{1,3}){3}\b|\.svc\b|\.cluster\.local\b|\.nip\.io\b/;
