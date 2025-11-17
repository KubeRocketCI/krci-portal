import { describe, it, expect } from "vitest";
import { getTokenExpirationTime } from "./index.js";
import { mockToken, mockTokenWithoutExp } from "../../__mocks__/token.js";

describe("getTokenExpirationTime", () => {
  it("should return decoded expiration time in milliseconds", () => {
    expect(getTokenExpirationTime(mockToken)).toBe(1746787364000);
  });
  it("should throw an error if token is not provided", () => {
    expect(() => getTokenExpirationTime("")).toThrow("Token is required");
  });
  it("should throw an error if token does not contain exp claim", () => {
    expect(() => getTokenExpirationTime(mockTokenWithoutExp)).toThrowError("ID token does not contain exp claim");
  });
});
