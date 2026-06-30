import { describe, it, expect } from "vitest";
import { gitProvider } from "@my-project/shared";
import { isGerritProvider } from "./utils";

describe("isGerritProvider", () => {
  it("is true for the gerrit provider", () => {
    expect(isGerritProvider(gitProvider.gerrit)).toBe(true);
  });

  it("is false for non-gerrit providers", () => {
    expect(isGerritProvider(gitProvider.github)).toBe(false);
    expect(isGerritProvider(gitProvider.gitlab)).toBe(false);
    expect(isGerritProvider(gitProvider.bitbucket)).toBe(false);
  });

  it("is false for empty / nullish provider values", () => {
    expect(isGerritProvider("")).toBe(false);
    expect(isGerritProvider(null)).toBe(false);
    expect(isGerritProvider(undefined)).toBe(false);
  });
});
