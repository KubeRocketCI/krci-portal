import { describe, expect, it } from "vitest";
import {
  getMajorMinorPatchOfVersion,
  createVersioningString,
  getVersionAndPostfixFromVersioningString,
  createReleaseNameString,
} from "./versioning.js";

describe("getMajorMinorPatchOfVersion", () => {
  it("should parse a standard version string", () => {
    expect(getMajorMinorPatchOfVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("should parse version with zeros", () => {
    expect(getMajorMinorPatchOfVersion("0.0.0")).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it("should parse large version numbers", () => {
    expect(getMajorMinorPatchOfVersion("10.20.30")).toEqual({ major: 10, minor: 20, patch: 30 });
  });
});

describe("createVersioningString", () => {
  it("should return version only when postfix is empty", () => {
    expect(createVersioningString("1.2.3", "")).toBe("1.2.3");
  });

  it("should return version-postfix when postfix is provided", () => {
    expect(createVersioningString("1.2.3", "SNAPSHOT")).toBe("1.2.3-SNAPSHOT");
  });
});

describe("getVersionAndPostfixFromVersioningString", () => {
  it("should split version and postfix", () => {
    expect(getVersionAndPostfixFromVersioningString("1.2.3-SNAPSHOT")).toEqual({
      version: "1.2.3",
      postfix: "SNAPSHOT",
    });
  });

  it("should handle version without postfix", () => {
    const result = getVersionAndPostfixFromVersioningString("1.2.3");
    expect(result.version).toBe("1.2.3");
    expect(result.postfix).toBeUndefined();
  });
});

describe("createReleaseNameString", () => {
  it("should create release name from major and minor", () => {
    expect(createReleaseNameString(1, 2)).toBe("release/1.2");
  });

  it("should handle zero values", () => {
    expect(createReleaseNameString(0, 0)).toBe("release/0.0");
  });
});
