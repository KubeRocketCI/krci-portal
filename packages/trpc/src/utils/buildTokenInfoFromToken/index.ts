import { getTokenExpirationTime } from "../getTokenExpirationTime/index.js";

export type TokenInfo = {
  idToken: string;
  idTokenExpiresAt: number;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
};

const DEFAULT_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extracts token metadata for token-based logins that provide a single token
 * (OIDC access-token login, Kubernetes Service Account token login, and the
 * stateless Bearer path). The token is stored as both idToken and accessToken,
 * and no refresh token is available, so the session expires when the token does.
 *
 * Expiration is taken from the JWT `exp` claim when present. When the token has
 * no decodable `exp` (opaque OIDC tokens, or legacy non-expiring Service Account
 * tokens), `defaultExpirationMs` is used instead. Callers that expect long-lived
 * tokens (e.g. legacy SA tokens) pass a larger default. The result is always
 * capped at MAX_SESSION_DURATION_MS to prevent attacker-controlled far-future
 * `exp` claims from extending the session indefinitely.
 */
export function buildTokenInfoFromToken(token: string, defaultExpirationMs: number = DEFAULT_EXPIRATION_MS): TokenInfo {
  const now = Date.now();
  let expiresAt: number;

  try {
    expiresAt = getTokenExpirationTime(token);
  } catch {
    // Opaque token or missing exp — cannot determine expiration, use default
    expiresAt = now + defaultExpirationMs;
  }

  // Cap expiration to prevent attacker-controlled far-future exp claims
  expiresAt = Math.min(expiresAt, now + MAX_SESSION_DURATION_MS);

  return {
    idToken: token,
    idTokenExpiresAt: expiresAt,
    accessToken: token,
    accessTokenExpiresAt: expiresAt,
    refreshToken: "",
  };
}
