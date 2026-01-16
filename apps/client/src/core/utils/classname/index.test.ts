import { describe, expect, test } from "vitest";
import { cn } from "./index";

describe("cn", () => {
  test("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("handles conditional classes", () => {
    expect(cn("foo", "baz")).toBe("foo baz");
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("handles undefined and null", () => {
    expect(cn("foo", undefined, "bar", null)).toBe("foo bar");
  });

  test("merges Tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  test("handles empty input", () => {
    expect(cn()).toBe("");
  });

  test("handles arrays", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  test("handles objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });
});
