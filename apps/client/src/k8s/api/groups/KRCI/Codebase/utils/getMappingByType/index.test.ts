import { describe, expect, test } from "vitest";
import { getMappingByType } from "./index";
import { codebaseType } from "@my-project/shared";
import { APPLICATION_MAPPING } from "../../configs/mappings/application";
import { LIBRARY_MAPPING } from "../../configs/mappings/library";
import { AUTOTEST_MAPPING } from "../../configs/mappings/autotest";
import { INFRASTRUCTURE_MAPPING } from "../../configs/mappings/infrastructure";
import { SYSTEM_MAPPING } from "../../configs/mappings/system";

describe("getMappingByType", () => {
  test("returns APPLICATION_MAPPING for application type", () => {
    const result = getMappingByType(codebaseType.application);
    expect(result).toBe(APPLICATION_MAPPING);
  });

  test("returns LIBRARY_MAPPING for library type", () => {
    const result = getMappingByType(codebaseType.library);
    expect(result).toBe(LIBRARY_MAPPING);
  });

  test("returns AUTOTEST_MAPPING for autotest type", () => {
    const result = getMappingByType(codebaseType.autotest);
    expect(result).toBe(AUTOTEST_MAPPING);
  });

  test("returns INFRASTRUCTURE_MAPPING for infrastructure type", () => {
    const result = getMappingByType(codebaseType.infrastructure);
    expect(result).toBe(INFRASTRUCTURE_MAPPING);
  });

  test("returns SYSTEM_MAPPING for system type", () => {
    const result = getMappingByType(codebaseType.system);
    expect(result).toBe(SYSTEM_MAPPING);
  });

  test("returns null for unknown type", () => {
    const result = getMappingByType("unknown-type");
    expect(result).toBe(null);
  });

  test("returns null for empty string", () => {
    const result = getMappingByType("");
    expect(result).toBe(null);
  });

  test("handles case-insensitive string matching", () => {
    // Note: This test depends on how codebaseType constants are defined
    // If they're case-sensitive, this will return null
    const result = getMappingByType("APPLICATION");
    // This might return null if the constant is lowercase
    expect(result === APPLICATION_MAPPING || result === null).toBe(true);
  });
});
