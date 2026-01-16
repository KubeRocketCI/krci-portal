import { describe, expect, test } from "vitest";
import { humanize } from "./index";
import { HUMANIZE_DURATION_OPTIONS } from "./constants";

describe("humanize", () => {
  test("formats duration in milliseconds", () => {
    const result = humanize(1000, HUMANIZE_DURATION_OPTIONS);
    expect(result).toBe("1s");
  });

  test("formats duration in seconds", () => {
    const result = humanize(5000, HUMANIZE_DURATION_OPTIONS);
    expect(result).toBe("5s");
  });

  test("formats duration in minutes", () => {
    const result = humanize(60000, HUMANIZE_DURATION_OPTIONS);
    expect(result).toBe("1m");
  });

  test("formats duration in hours", () => {
    const result = humanize(3600000, HUMANIZE_DURATION_OPTIONS);
    expect(result).toBe("1h");
  });

  test("formats duration in days", () => {
    const result = humanize(86400000, HUMANIZE_DURATION_OPTIONS);
    expect(result).toBe("1d");
  });

  test("formats combined durations (largest 2 units)", () => {
    const result = humanize(90061000, HUMANIZE_DURATION_OPTIONS); // 1d 1h 1m 1s
    expect(result).toMatch(/1d/);
    expect(result).toMatch(/1h/);
  });

  test("uses en-mini language format", () => {
    const result = humanize(60000, HUMANIZE_DURATION_OPTIONS);
    expect(result).toMatch(/^[0-9]+[dhms]$/);
  });

  test("handles zero duration", () => {
    const result = humanize(0, HUMANIZE_DURATION_OPTIONS);
    expect(result).toBe("0s");
  });

  test("rounds values correctly", () => {
    const result = humanize(90000, HUMANIZE_DURATION_OPTIONS); // 1.5 minutes
    expect(result).toBe("1m 30s"); // Shows largest 2 units with rounding
  });
});
