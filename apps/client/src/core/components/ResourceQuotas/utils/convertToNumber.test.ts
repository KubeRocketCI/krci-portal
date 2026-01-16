import { describe, expect, test } from "vitest";
import { convertToNumber } from "./convertToNumber";

describe("convertToNumber", () => {
  test("converts milli units (m suffix)", () => {
    expect(convertToNumber("500m")).toBe(0.5);
    expect(convertToNumber("1000m")).toBe(1);
    expect(convertToNumber("250m")).toBe(0.25);
  });

  test("converts Gibi units (Gi suffix)", () => {
    expect(convertToNumber("1Gi")).toBe(1024);
    expect(convertToNumber("2Gi")).toBe(2048);
    expect(convertToNumber("0.5Gi")).toBe(512);
  });

  test("converts Mebi units (Mi suffix)", () => {
    expect(convertToNumber("512Mi")).toBe(512);
    expect(convertToNumber("1024Mi")).toBe(1024);
    expect(convertToNumber("256Mi")).toBe(256);
  });

  test("converts Kibi units (Ki suffix)", () => {
    expect(convertToNumber("1024Ki")).toBe(1);
    expect(convertToNumber("2048Ki")).toBe(2);
    expect(convertToNumber("512Ki")).toBe(0.5);
  });

  test("converts Tebi units (Ti suffix)", () => {
    expect(convertToNumber("1Ti")).toBe(1048576);
    expect(convertToNumber("2Ti")).toBe(2097152);
    expect(convertToNumber("0.5Ti")).toBe(524288);
  });

  test("converts plain numbers without suffix", () => {
    expect(convertToNumber("100")).toBe(100);
    expect(convertToNumber("500")).toBe(500);
    expect(convertToNumber("1000")).toBe(1000);
  });

  test("handles decimal values", () => {
    expect(convertToNumber("1.5")).toBe(1.5);
    expect(convertToNumber("2.75")).toBe(2.75);
    expect(convertToNumber("0.125")).toBe(0.125);
  });

  test("handles zero values", () => {
    expect(convertToNumber("0")).toBe(0);
    expect(convertToNumber("0m")).toBe(0);
    expect(convertToNumber("0Gi")).toBe(0);
  });

  test("handles invalid inputs gracefully", () => {
    expect(convertToNumber("invalid")).toBeNaN();
    expect(convertToNumber("")).toBeNaN();
  });
});
