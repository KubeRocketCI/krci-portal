import { jwtDecode } from "jwt-decode";

export const getTokenExpirationTime = (token: string): number => {
  if (!token) {
    throw new Error("Token is required");
  }

  try {
    const decoded = jwtDecode(token);

    if (!decoded.exp) {
      throw new Error("ID token does not contain exp claim");
    }

    return (decoded.exp as number) * 1000; // convert to milliseconds
  } catch (err) {
    throw new Error(`Failed to decode ID token: ${(err as Error).message}`);
  }
};
