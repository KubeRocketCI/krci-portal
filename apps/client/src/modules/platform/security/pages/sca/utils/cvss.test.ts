import { describe, expect, test, vi } from "vitest";
import { getCvssColor } from "./cvss";

// Mock the CVSS_COLORS constant
vi.mock("../constants/colors", () => ({
  CVSS_COLORS: {
    CRITICAL: "#DC2626",
    HIGH: "#EA580C",
    MEDIUM: "#F59E0B",
    LOW: "#3B82F6",
    NONE: "#6B7280",
  },
}));

describe("getCvssColor", () => {
  test("returns CRITICAL color for scores >= 9.0", () => {
    expect(getCvssColor(9.0)).toBe("#DC2626");
    expect(getCvssColor(9.5)).toBe("#DC2626");
    expect(getCvssColor(10.0)).toBe("#DC2626");
  });

  test("returns HIGH color for scores >= 7.0 and < 9.0", () => {
    expect(getCvssColor(7.0)).toBe("#EA580C");
    expect(getCvssColor(7.5)).toBe("#EA580C");
    expect(getCvssColor(8.0)).toBe("#EA580C");
    expect(getCvssColor(8.9)).toBe("#EA580C");
  });

  test("returns MEDIUM color for scores >= 4.0 and < 7.0", () => {
    expect(getCvssColor(4.0)).toBe("#F59E0B");
    expect(getCvssColor(5.0)).toBe("#F59E0B");
    expect(getCvssColor(6.0)).toBe("#F59E0B");
    expect(getCvssColor(6.9)).toBe("#F59E0B");
  });

  test("returns LOW color for scores < 4.0 and > 0", () => {
    expect(getCvssColor(0.1)).toBe("#3B82F6");
    expect(getCvssColor(1.0)).toBe("#3B82F6");
    expect(getCvssColor(2.0)).toBe("#3B82F6");
    expect(getCvssColor(3.0)).toBe("#3B82F6");
    expect(getCvssColor(3.9)).toBe("#3B82F6");
  });

  test("returns NONE color for score of 0", () => {
    expect(getCvssColor(0)).toBe("#6B7280");
  });

  test("returns NONE color for undefined", () => {
    expect(getCvssColor(undefined)).toBe("#6B7280");
  });

  test("handles boundary values correctly", () => {
    // Lower boundary of CRITICAL
    expect(getCvssColor(9.0)).toBe("#DC2626");

    // Upper boundary of HIGH
    expect(getCvssColor(8.99)).toBe("#EA580C");

    // Lower boundary of HIGH
    expect(getCvssColor(7.0)).toBe("#EA580C");

    // Upper boundary of MEDIUM
    expect(getCvssColor(6.99)).toBe("#F59E0B");

    // Lower boundary of MEDIUM
    expect(getCvssColor(4.0)).toBe("#F59E0B");

    // Upper boundary of LOW
    expect(getCvssColor(3.99)).toBe("#3B82F6");
  });

  test("handles decimal scores", () => {
    expect(getCvssColor(9.8)).toBe("#DC2626");
    expect(getCvssColor(7.5)).toBe("#EA580C");
    expect(getCvssColor(5.5)).toBe("#F59E0B");
    expect(getCvssColor(2.3)).toBe("#3B82F6");
  });

  test("handles maximum score", () => {
    expect(getCvssColor(10.0)).toBe("#DC2626");
  });

  test("handles minimum non-zero score", () => {
    expect(getCvssColor(0.1)).toBe("#3B82F6");
  });

  test("handles very small non-zero scores", () => {
    expect(getCvssColor(0.01)).toBe("#3B82F6");
    expect(getCvssColor(0.001)).toBe("#3B82F6");
  });
});
