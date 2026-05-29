import { describe, it, expect } from "vitest";
import { formatLogText } from "./format";

describe("formatLogText", () => {
  describe("showTimestamps = false", () => {
    it("strips the [[timestamp]] prefix, leaving the message", () => {
      expect(formatLogText("[[2026-05-29T12:00:00Z]] hello world", false)).toBe("hello world");
    });

    it("strips every timestamp marker on a line", () => {
      expect(formatLogText("[[2026-05-29T12:00:00Z]] a [[2026-05-29T12:00:01Z]] b", false)).toBe("a b");
    });

    it("strips fractional-second timestamps", () => {
      expect(formatLogText("[[2026-05-29T12:00:00.123Z]] payload", false)).toBe("payload");
    });

    it("leaves lines without a timestamp marker unchanged", () => {
      expect(formatLogText("plain log line", false)).toBe("plain log line");
    });

    it("strips markers across every line of a multi-line blob", () => {
      const input = "[[2026-05-29T12:00:00Z]] first\n[[2026-05-29T12:00:01Z]] second";
      expect(formatLogText(input, false)).toBe("first\nsecond");
    });
  });

  describe("showTimestamps = true", () => {
    it("replaces the raw [[...]] marker with a bracketed locale time", () => {
      const out = formatLogText("[[2026-05-29T12:00:00Z]] hello", true);
      // Locale/timezone of the runner is unknown, so assert structure, not an exact time.
      expect(out).not.toContain("[[");
      expect(out).toMatch(/^\[ .+ \] hello$/);
    });

    it("preserves the original message text alongside the formatted time", () => {
      expect(formatLogText("[[2026-05-29T12:00:00Z]] deploy finished", true)).toContain("deploy finished");
    });

    it("leaves lines without a timestamp marker unchanged", () => {
      expect(formatLogText("plain log line", true)).toBe("plain log line");
    });

    it("formats markers on every line of a multi-line blob", () => {
      const input = "[[2026-05-29T12:00:00Z]] first\n[[2026-05-29T12:00:01Z]] second";
      const lines = formatLogText(input, true).split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatch(/^\[ .+ \] first$/);
      expect(lines[1]).toMatch(/^\[ .+ \] second$/);
    });

    it("falls back to the original text for a semantically invalid timestamp", () => {
      // Matches the digit pattern but is not a real date — must not render "Invalid Date".
      const input = "[[9999-99-99T99:99:99Z]] message";
      const out = formatLogText(input, true);
      expect(out).not.toContain("Invalid Date");
      expect(out).toBe(input);
    });
  });
});
