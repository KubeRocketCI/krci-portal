import { describe, expect, it } from "vitest";
import { isKRCIVersioning } from "./isKRCIVersioning.js";
import { codebaseVersioning } from "../models/index.js";

describe("isKRCIVersioning", () => {
  it("returns true for edp versioning", () => {
    expect(isKRCIVersioning(codebaseVersioning.edp)).toBe(true);
  });

  it("returns true for semver versioning", () => {
    expect(isKRCIVersioning(codebaseVersioning.semver)).toBe(true);
  });

  it("returns false for default versioning", () => {
    expect(isKRCIVersioning(codebaseVersioning.default)).toBe(false);
  });

  it("returns false when versioning type is undefined", () => {
    expect(isKRCIVersioning(undefined)).toBe(false);
  });
});
