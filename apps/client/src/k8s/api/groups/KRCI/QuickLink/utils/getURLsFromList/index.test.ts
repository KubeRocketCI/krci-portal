import { describe, expect, test } from "vitest";
import { getQuickLinkURLsFromList } from "./index";
import type { QuickLink } from "@my-project/shared";

describe("getQuickLinkURLsFromList", () => {
  test("converts array of QuickLinks to Record of URLs", () => {
    const quickLinks: QuickLink[] = [
      {
        metadata: { name: "link1" },
        spec: { url: "https://example.com/1" },
      } as QuickLink,
      {
        metadata: { name: "link2" },
        spec: { url: "https://example.com/2" },
      } as QuickLink,
    ];

    const result = getQuickLinkURLsFromList(quickLinks);

    expect(result).toEqual({
      link1: "https://example.com/1",
      link2: "https://example.com/2",
    });
  });

  test("handles empty array", () => {
    const result = getQuickLinkURLsFromList([]);
    expect(result).toEqual({});
  });

  test("handles single QuickLink", () => {
    const quickLinks: QuickLink[] = [
      {
        metadata: { name: "single-link" },
        spec: { url: "https://example.com" },
      } as QuickLink,
    ];

    const result = getQuickLinkURLsFromList(quickLinks);

    expect(result).toEqual({
      "single-link": "https://example.com",
    });
  });

  test("overwrites duplicate names with last value", () => {
    const quickLinks: QuickLink[] = [
      {
        metadata: { name: "duplicate" },
        spec: { url: "https://example.com/first" },
      } as QuickLink,
      {
        metadata: { name: "duplicate" },
        spec: { url: "https://example.com/last" },
      } as QuickLink,
    ];

    const result = getQuickLinkURLsFromList(quickLinks);

    expect(result).toEqual({
      duplicate: "https://example.com/last",
    });
  });

  test("handles URLs with special characters", () => {
    const quickLinks: QuickLink[] = [
      {
        metadata: { name: "special" },
        spec: { url: "https://example.com/path?query=value&other=123" },
      } as QuickLink,
    ];

    const result = getQuickLinkURLsFromList(quickLinks);

    expect(result).toEqual({
      special: "https://example.com/path?query=value&other=123",
    });
  });
});
