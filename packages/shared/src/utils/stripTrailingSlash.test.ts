import { describe, it, expect } from "vitest";
import { stripTrailingSlash } from "./stripTrailingSlash.js";

describe("stripTrailingSlash", () => {
  it("should strip a single trailing slash", () => {
    expect(stripTrailingSlash("https://host/")).toBe("https://host");
  });

  it("should strip multiple trailing slashes", () => {
    expect(stripTrailingSlash("https://host///")).toBe("https://host");
  });

  it("should return string unchanged if no trailing slash", () => {
    expect(stripTrailingSlash("https://host")).toBe("https://host");
  });

  it("should handle a single slash", () => {
    expect(stripTrailingSlash("/")).toBe("");
  });

  it("should not strip internal slashes", () => {
    expect(stripTrailingSlash("https://host/a/b/")).toBe("https://host/a/b");
  });

  it("should return empty string for empty input", () => {
    expect(stripTrailingSlash("")).toBe("");
  });

  it("should return empty string for null", () => {
    expect(stripTrailingSlash(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(stripTrailingSlash(undefined)).toBe("");
  });

  it("should run in linear time on a long run of trailing slashes", () => {
    const input = `https://host${"/".repeat(100000)}`;
    expect(stripTrailingSlash(input)).toBe("https://host");
  });
});
