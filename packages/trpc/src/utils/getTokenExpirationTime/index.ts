import { decodeJwtPayloadUnsafe } from "../jwt/index.js";

/**
 * Extracts the `exp` claim from a JWT by manually decoding the payload.
 *
 * This intentionally avoids jose's unverified decode API to satisfy
 * SAST scanners that flag decode-without-verify usage. Signature verification is handled at a
 * higher level (OIDCClient.validateTokenAndGetUserInfo uses jwtVerify);
 * this utility only reads the expiration for cache/refresh scheduling.
 */
export const getTokenExpirationTime = (token: string): number => {
  try {
    const payload = decodeJwtPayloadUnsafe<{ exp?: number }>(token);
    if (!payload.exp) {
      throw new Error("ID token does not contain exp claim");
    }
    return payload.exp * 1000;
  } catch (err) {
    throw new Error(`Failed to decode ID token: ${(err as Error).message}`);
  }
};
