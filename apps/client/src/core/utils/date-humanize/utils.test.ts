import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { formatTimestamp, formatUnixTimestamp, formatDuration } from "./utils";

describe("formatTimestamp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("formats valid ISO timestamp", () => {
    const timestamp = "2024-01-15T10:30:00Z";
    const result = formatTimestamp(timestamp);
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
    // Note: Time will vary based on local timezone, so we don't check specific hour
    expect(result).not.toBe("N/A");
  });

  test("returns 'N/A' for undefined", () => {
    expect(formatTimestamp(undefined)).toBe("N/A");
  });

  test("returns 'N/A' for empty string", () => {
    expect(formatTimestamp("")).toBe("N/A");
  });

  test("returns 'Invalid Date' for invalid timestamp", () => {
    expect(formatTimestamp("invalid-date")).toBe("Invalid Date");
  });

  test("handles different timezone timestamps", () => {
    const timestamp = "2024-01-15T10:30:00+05:00";
    const result = formatTimestamp(timestamp);
    expect(result).not.toBe("N/A");
    expect(result).toMatch(/Jan/);
  });
});

describe("formatUnixTimestamp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("formats valid Unix timestamp in milliseconds", () => {
    const timestamp = 1705315800000; // 2024-01-15T10:30:00Z
    const result = formatUnixTimestamp(timestamp);
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
    // Note: Time will vary based on local timezone, so we don't check specific hour/minute
    expect(result).not.toBe("N/A");
  });

  test("returns 'N/A' for undefined", () => {
    expect(formatUnixTimestamp(undefined)).toBe("N/A");
  });

  test("returns 'N/A' for 0", () => {
    expect(formatUnixTimestamp(0)).toBe("N/A");
  });

  test("uses custom format options", () => {
    const timestamp = 1705315800000;
    const customOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
    };
    const result = formatUnixTimestamp(timestamp, customOptions);
    expect(result).toMatch(/January/);
    expect(result).toMatch(/2024/);
  });

  test("handles negative timestamps", () => {
    const timestamp = -1000;
    const result = formatUnixTimestamp(timestamp);
    expect(result).not.toBe("N/A");
  });
});

describe("formatDuration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("calculates duration between two timestamps", () => {
    const startTime = "2024-01-15T10:00:00Z";
    const endTime = "2024-01-15T12:00:00Z";
    const result = formatDuration(startTime, endTime);
    expect(result).toMatch(/2h/);
  });

  test("uses current time when endTime is not provided", () => {
    const startTime = "2024-01-15T10:00:00Z";
    const result = formatDuration(startTime);
    expect(result).toMatch(/2h/);
  });

  test("returns 'N/A' for undefined startTime", () => {
    expect(formatDuration(undefined)).toBe("N/A");
  });

  test("returns 'N/A' for empty startTime", () => {
    expect(formatDuration("")).toBe("N/A");
  });

  test("returns '0s' for invalid startTime", () => {
    // Invalid date becomes NaN timestamp, resulting in 0 duration
    expect(formatDuration("invalid-date")).toBe("0s");
  });

  test("handles negative duration (end before start)", () => {
    const startTime = "2024-01-15T12:00:00Z";
    const endTime = "2024-01-15T10:00:00Z";
    const result = formatDuration(startTime, endTime);
    // humanize-duration returns absolute value for negative durations
    expect(result).toBe("2h");
  });

  test("formats duration in different units", () => {
    const startTime = "2024-01-15T10:00:00Z";
    const endTime = "2024-01-15T10:01:30Z";
    const result = formatDuration(startTime, endTime);
    expect(result).toMatch(/1m/);
  });
});
