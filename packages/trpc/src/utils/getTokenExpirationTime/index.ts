import { decodeJwt } from "jose";

export const getTokenExpirationTime = (token: string): number => {
  if (!token) {
    throw new Error("Token is required");
  }

  try {
    const decoded = decodeJwt(token);

    if (!decoded.exp) {
      throw new Error("ID token does not contain exp claim");
    }

    return decoded.exp * 1000; // convert to milliseconds
  } catch (err) {
    throw new Error(`Failed to decode ID token: ${(err as Error).message}`);
  }
};
