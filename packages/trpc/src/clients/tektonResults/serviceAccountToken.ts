import { readFileSync } from "node:fs";

const TOKEN_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/token";
const CACHE_TTL_MS = 60_000; // kubelet rotates the file in place

interface TokenCache {
  token: string;
  readAt: number;
}

let cache: TokenCache | null = null;

/** The pod's projected ServiceAccount token, cached for CACHE_TTL_MS. `null` when the file is missing, unreadable or empty; `null` is not cached. */
export function readServiceAccountToken(): string | null {
  const now = Date.now();

  if (cache && now - cache.readAt < CACHE_TTL_MS) {
    return cache.token;
  }

  cache = null;

  try {
    const token = readFileSync(TOKEN_PATH, "utf8").trim();

    if (!token) return null;

    cache = { token, readAt: now };

    return token;
  } catch {
    return null;
  }
}
