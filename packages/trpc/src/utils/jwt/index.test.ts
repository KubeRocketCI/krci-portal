import { describe, it, expect } from "vitest";
import { decodeJwtPayloadUnsafe, getJwtPayloadClaim } from "./index.js";
import { mockToken, mockTokenWithoutExp } from "../../__mocks__/token.js";

describe("decodeJwtPayloadUnsafe", () => {
  it("should decode a valid JWT payload", () => {
    const payload = decodeJwtPayloadUnsafe(mockToken);
    expect(payload).toMatchObject({
      exp: 1746787364,
      iat: 1746785864,
      sub: "3705dd06-7992-44aa-85ac-d35e664e87d5",
      name: "John Doe",
    });
  });

  it("should decode a JWT without exp claim", () => {
    const payload = decodeJwtPayloadUnsafe(mockTokenWithoutExp);
    expect(payload).toMatchObject({
      sub: "3705dd06-7992-44aa-85ac-d35e664e87d5",
    });
    expect(payload).not.toHaveProperty("exp");
  });

  it("should throw for empty string", () => {
    expect(() => decodeJwtPayloadUnsafe("")).toThrow("Token is required");
  });

  it("should throw for token with fewer than 3 parts", () => {
    expect(() => decodeJwtPayloadUnsafe("header.payload")).toThrow("Token is not a valid JWT (expected 3 parts)");
  });

  it("should throw for token with more than 3 parts", () => {
    expect(() => decodeJwtPayloadUnsafe("a.b.c.d")).toThrow("Token is not a valid JWT (expected 3 parts)");
  });

  it("should throw for token with invalid base64 JSON payload", () => {
    // base64 of "not-json"
    const invalidPayload = Buffer.from("not-json").toString("base64");
    expect(() => decodeJwtPayloadUnsafe(`header.${invalidPayload}.sig`)).toThrow();
  });

  it("should handle base64url encoding (- and _ characters)", () => {
    // Payload with characters that differ between base64url and standard base64
    const payload = { sub: "test+user/name" };
    const base64url = Buffer.from(JSON.stringify(payload))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const result = decodeJwtPayloadUnsafe(`header.${base64url}.sig`);
    expect(result).toEqual(payload);
  });
});

describe("getJwtPayloadClaim", () => {
  it("should return a string claim", () => {
    expect(getJwtPayloadClaim(mockToken, "sub")).toBe("3705dd06-7992-44aa-85ac-d35e664e87d5");
  });

  it("should return a number claim", () => {
    expect(getJwtPayloadClaim(mockToken, "exp")).toBe(1746787364);
  });

  it("should return an array claim", () => {
    expect(getJwtPayloadClaim(mockToken, "groups")).toEqual(["admins"]);
  });

  it("should return undefined for a missing claim", () => {
    expect(getJwtPayloadClaim(mockToken, "nonexistent")).toBeUndefined();
  });

  it("should throw for an invalid token", () => {
    expect(() => getJwtPayloadClaim("", "sub")).toThrow("Token is required");
  });
});
