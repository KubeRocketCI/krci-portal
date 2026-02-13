import { describe, expect, it } from "vitest";
import { isAutotest, isLibrary, isApplication, isInfrastructure, isSystem } from "./index.js";
import { codebaseType } from "../../constants.js";

const makeCb = (type: string) => ({ spec: { type } }) as any;

describe("Codebase type checks", () => {
  it("isAutotest should return true only for autotest type", () => {
    expect(isAutotest(makeCb(codebaseType.autotest))).toBe(true);
    expect(isAutotest(makeCb(codebaseType.application))).toBe(false);
  });

  it("isLibrary should return true only for library type", () => {
    expect(isLibrary(makeCb(codebaseType.library))).toBe(true);
    expect(isLibrary(makeCb(codebaseType.application))).toBe(false);
  });

  it("isApplication should return true only for application type", () => {
    expect(isApplication(makeCb(codebaseType.application))).toBe(true);
    expect(isApplication(makeCb(codebaseType.library))).toBe(false);
  });

  it("isInfrastructure should return true only for infrastructure type", () => {
    expect(isInfrastructure(makeCb(codebaseType.infrastructure))).toBe(true);
    expect(isInfrastructure(makeCb(codebaseType.application))).toBe(false);
  });

  it("isSystem should return true only for system type", () => {
    expect(isSystem(makeCb(codebaseType.system))).toBe(true);
    expect(isSystem(makeCb(codebaseType.application))).toBe(false);
  });
});
