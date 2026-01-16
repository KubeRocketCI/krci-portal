import { describe, expect, test } from "vitest";
import { formatDebtTime, formatRating, formatNumber, formatPercentage, formatDate } from "./formatters";

describe("formatDebtTime", () => {
  test("formats minutes correctly", () => {
    expect(formatDebtTime("1min")).toBe("1 min");
    expect(formatDebtTime("5min")).toBe("5 mins");
    expect(formatDebtTime("30min")).toBe("30 mins");
  });

  test("formats hours correctly", () => {
    expect(formatDebtTime("1h")).toBe("1 hour");
    expect(formatDebtTime("2h")).toBe("2 hours");
    expect(formatDebtTime("24h")).toBe("24 hours");
  });

  test("formats days correctly", () => {
    expect(formatDebtTime("1d")).toBe("1 day");
    expect(formatDebtTime("5d")).toBe("5 days");
    expect(formatDebtTime("30d")).toBe("30 days");
  });

  test("returns em dash for undefined", () => {
    expect(formatDebtTime(undefined)).toBe("—");
  });

  test("returns em dash for empty string", () => {
    expect(formatDebtTime("")).toBe("—");
  });

  test("returns original string for invalid format", () => {
    expect(formatDebtTime("invalid")).toBe("invalid");
    expect(formatDebtTime("10s")).toBe("10s");
    expect(formatDebtTime("5weeks")).toBe("5weeks");
  });

  test("handles zero values", () => {
    expect(formatDebtTime("0min")).toBe("0 mins");
    expect(formatDebtTime("0h")).toBe("0 hours");
    expect(formatDebtTime("0d")).toBe("0 days");
  });
});

describe("formatRating", () => {
  test("formats ratings correctly", () => {
    expect(formatRating("1.0")).toBe("A");
    expect(formatRating("2.0")).toBe("B");
    expect(formatRating("3.0")).toBe("C");
    expect(formatRating("4.0")).toBe("D");
    expect(formatRating("5.0")).toBe("E");
  });

  test("returns em dash for undefined", () => {
    expect(formatRating(undefined)).toBe("—");
  });

  test("returns em dash for empty string", () => {
    expect(formatRating("")).toBe("—");
  });

  test("returns em dash for unknown ratings", () => {
    expect(formatRating("6.0")).toBe("—");
    expect(formatRating("0.5")).toBe("—");
    expect(formatRating("invalid")).toBe("—");
  });
});

describe("formatNumber", () => {
  test("formats numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  test("formats string numbers", () => {
    expect(formatNumber("1000")).toBe("1,000");
    expect(formatNumber("1234567.89")).toBe("1,234,567.89");
  });

  test("formats small numbers without commas", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1)).toBe("1");
    expect(formatNumber(999)).toBe("999");
  });

  test("handles decimal numbers", () => {
    expect(formatNumber(1234.56)).toBe("1,234.56");
    expect(formatNumber(0.123)).toBe("0.123");
  });

  test("returns em dash for undefined", () => {
    expect(formatNumber(undefined)).toBe("—");
  });

  test("returns em dash for null", () => {
    expect(formatNumber(null as unknown as number)).toBe("—");
  });

  test("returns em dash for invalid strings", () => {
    expect(formatNumber("invalid")).toBe("—");
    expect(formatNumber("not a number")).toBe("—");
  });

  test("handles negative numbers", () => {
    expect(formatNumber(-1000)).toBe("-1,000");
    expect(formatNumber(-1234567)).toBe("-1,234,567");
  });
});

describe("formatPercentage", () => {
  test("formats percentages with one decimal place", () => {
    expect(formatPercentage(50)).toBe("50.0%");
    expect(formatPercentage(75.5)).toBe("75.5%");
    expect(formatPercentage(100)).toBe("100.0%");
  });

  test("formats string percentages", () => {
    expect(formatPercentage("50")).toBe("50.0%");
    expect(formatPercentage("75.5")).toBe("75.5%");
  });

  test("rounds to one decimal place", () => {
    expect(formatPercentage(50.123)).toBe("50.1%");
    expect(formatPercentage(75.999)).toBe("76.0%");
  });

  test("handles zero", () => {
    expect(formatPercentage(0)).toBe("0.0%");
  });

  test("handles very small values", () => {
    expect(formatPercentage(0.001)).toBe("0.0%");
    expect(formatPercentage(0.1)).toBe("0.1%");
  });

  test("returns em dash for undefined", () => {
    expect(formatPercentage(undefined)).toBe("—");
  });

  test("returns em dash for null", () => {
    expect(formatPercentage(null as unknown as number)).toBe("—");
  });

  test("returns em dash for invalid strings", () => {
    expect(formatPercentage("invalid")).toBe("—");
  });

  test("handles negative values", () => {
    expect(formatPercentage(-10)).toBe("-10.0%");
  });
});

describe("formatDate", () => {
  test("formats valid date strings", () => {
    const dateString = "2024-01-15T10:30:00Z";
    const result = formatDate(dateString);

    expect(result).toBeTruthy();
    expect(result).not.toBe("—");
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  test("returns em dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  test("returns em dash for empty string", () => {
    expect(formatDate("")).toBe("—");
  });

  test("returns 'Invalid Date' for invalid date", () => {
    const invalidDate = "not-a-date";
    expect(formatDate(invalidDate)).toBe("Invalid Date");
  });

  test("handles different date formats", () => {
    const dates = ["2024-01-15", "2024-01-15T10:30:00Z", "2024-01-15T10:30:00+00:00"];

    dates.forEach((date) => {
      const result = formatDate(date);
      expect(result).not.toBe("—");
      expect(result).toBeTruthy();
    });
  });
});
