import { describe, expect, it } from "vitest";
import { getTabIndex } from "./constants";

describe("getTabIndex", () => {
  it("places the findings tab after Dependencies and before Pull Requests", () => {
    expect(getTabIndex("vulnerabilities", true)).toBe(4);
    expect(getTabIndex("findings", true)).toBe(5);
    expect(getTabIndex("code", true)).toBe(6);
    expect(getTabIndex("deployments", true)).toBe(7);
  });

  it("shifts the tabs after Dependencies back when the findings tab is absent", () => {
    expect(getTabIndex("vulnerabilities", false)).toBe(4);
    expect(getTabIndex("code", false)).toBe(5);
    expect(getTabIndex("deployments", false)).toBe(6);
  });

  it("falls back to Overview for ?tab=findings without the tab", () => {
    expect(getTabIndex("findings", false)).toBe(0);
  });

  it("opens Overview without a tab", () => {
    expect(getTabIndex(undefined, true)).toBe(0);
  });
});
