import { describe, expect, it } from "vitest";
import { VIEW_MODES, type ViewMode } from "@/core/providers/ViewMode/types";
import { agentsView } from "./view";

describe("agentsView", () => {
  it("gives the saved view", () => {
    expect(agentsView(VIEW_MODES.TABLE)).toBe(VIEW_MODES.TABLE);
    expect(agentsView(VIEW_MODES.GRID)).toBe(VIEW_MODES.GRID);
  });

  it("gives the table for a saved view that the page has not", () => {
    expect(agentsView(VIEW_MODES.COMPACT)).toBe(VIEW_MODES.TABLE);
    expect(agentsView(VIEW_MODES.DETAILED)).toBe(VIEW_MODES.TABLE);
    expect(agentsView("list" as ViewMode)).toBe(VIEW_MODES.TABLE);
  });
});
