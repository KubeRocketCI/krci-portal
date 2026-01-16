import { describe, expect, test } from "vitest";
import { isSystemQuickLink } from "./index";
import { systemQuickLink } from "@my-project/shared";
import type { QuickLink } from "@my-project/shared";

describe("isSystemQuickLink", () => {
  test("returns true for system quick link", () => {
    const systemLinkNames = Object.values(systemQuickLink);
    const quickLink: QuickLink = {
      metadata: { name: systemLinkNames[0] },
    } as QuickLink;

    expect(isSystemQuickLink(quickLink)).toBe(true);
  });

  test("returns false for non-system quick link", () => {
    const quickLink: QuickLink = {
      metadata: { name: "custom-link-name" },
    } as QuickLink;

    expect(isSystemQuickLink(quickLink)).toBe(false);
  });

  test("returns false for null/undefined component", () => {
    expect(isSystemQuickLink(null as unknown as QuickLink)).toBe(false);
    expect(isSystemQuickLink(undefined as unknown as QuickLink)).toBe(false);
  });

  test("returns false for empty metadata name", () => {
    const quickLink: QuickLink = {
      metadata: { name: "" },
    } as QuickLink;

    expect(isSystemQuickLink(quickLink)).toBe(false);
  });

  test("handles all system quick link types", () => {
    const systemLinkNames = Object.values(systemQuickLink);

    systemLinkNames.forEach((linkName) => {
      const quickLink: QuickLink = {
        metadata: { name: linkName },
      } as QuickLink;
      expect(isSystemQuickLink(quickLink)).toBe(true);
    });
  });
});
