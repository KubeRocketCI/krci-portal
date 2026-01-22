const SENSITIVE_PATTERNS = [
  "SECRET",
  "PASSWORD",
  "TOKEN",
  "KEY",
  "CREDENTIAL",
  "AUTH",
  "PRIVATE",
  "CERT",
];

export function isSensitiveEnvKey(key: string): boolean {
  const upperKey = key.toUpperCase();
  return SENSITIVE_PATTERNS.some((pattern) => upperKey.includes(pattern));
}

export function maskEnvValue(key: string, value: string | undefined): string {
  if (value === undefined) {
    return "<not set>";
  }
  if (value === "") {
    return "<empty>";
  }
  return isSensitiveEnvKey(key) ? "******" : value;
}
