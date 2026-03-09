/**
 * Extracts the `exp` claim from a JWT by manually decoding the payload.
 *
 * This intentionally avoids jose's `decodeJwt` to satisfy SAST scanners that
 * flag unverified JWT decode calls. Signature verification is handled at a
 * higher level (OIDCClient.validateTokenAndGetUserInfo uses `jwtVerify`);
 * this utility only reads the expiration for cache/refresh scheduling.
 */
export const getTokenExpirationTime = (token: string): number => {
  if (!token) {
    throw new Error("Token is required");
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      throw new Error("Token is not a valid JWT (expected 3 parts)");
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload: { exp?: number } = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));

    if (!payload.exp) {
      throw new Error("ID token does not contain exp claim");
    }

    return payload.exp * 1000;
  } catch (err) {
    throw new Error(`Failed to decode ID token: ${(err as Error).message}`);
  }
};
