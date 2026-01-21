import { describe, it, expect } from "vitest";
import { stripLeadingSlash } from "./stripLeadingSlash.js";

describe("stripLeadingSlash", () => {
  it("should strip leading slash from path", () => {
    expect(stripLeadingSlash("/my/path")).toBe("my/path");
  });

  it("should return path unchanged if no leading slash", () => {
    expect(stripLeadingSlash("my/path")).toBe("my/path");
  });

  it("should handle single slash", () => {
    expect(stripLeadingSlash("/")).toBe("");
  });

  it("should return empty string for empty input", () => {
    expect(stripLeadingSlash("")).toBe("");
  });

  it("should return empty string for null", () => {
    expect(stripLeadingSlash(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(stripLeadingSlash(undefined)).toBe("");
  });

  it("should only strip first slash", () => {
    expect(stripLeadingSlash("//double/slash")).toBe("/double/slash");
  });

  it("should handle path with trailing slash", () => {
    expect(stripLeadingSlash("/path/")).toBe("path/");
  });
});
