import { describe, expect, it } from "vitest";
import { VIEW_MODES, type ViewMode } from "@/core/providers/ViewMode/types";
import { workerAnchor, workerPoolAnchor } from "../../../utils/rowAnchor";
import { workerPoolsView } from "./view";

const WORKER_HASH = workerAnchor({ workerNamespace: "krci-agents", workerPool: "workers", name: "w1" });
const WORKER_POOL_HASH = workerPoolAnchor({ namespace: "krci-agents", name: "workers" });

describe("workerPoolsView", () => {
  it("gives the saved view with no hash", () => {
    expect(workerPoolsView(VIEW_MODES.GRID, "")).toBe(VIEW_MODES.GRID);
    expect(workerPoolsView(VIEW_MODES.TABLE, "")).toBe(VIEW_MODES.TABLE);
  });

  it("gives cards for a hash that names a worker, whatever view is saved", () => {
    expect(workerPoolsView(VIEW_MODES.TABLE, WORKER_HASH)).toBe(VIEW_MODES.GRID);
    expect(workerPoolsView(VIEW_MODES.GRID, WORKER_HASH)).toBe(VIEW_MODES.GRID);
  });

  it("keeps the saved view for a hash that names a worker pool", () => {
    expect(workerPoolsView(VIEW_MODES.TABLE, WORKER_POOL_HASH)).toBe(VIEW_MODES.TABLE);
    expect(workerPoolsView(VIEW_MODES.GRID, WORKER_POOL_HASH)).toBe(VIEW_MODES.GRID);
  });

  it("gives the view that the link asks for over the saved view", () => {
    expect(workerPoolsView(VIEW_MODES.TABLE, "", VIEW_MODES.GRID)).toBe(VIEW_MODES.GRID);
    expect(workerPoolsView(VIEW_MODES.GRID, WORKER_POOL_HASH, VIEW_MODES.TABLE)).toBe(VIEW_MODES.TABLE);
  });

  it("gives cards for a hash that names a worker, whatever view the link asks for", () => {
    expect(workerPoolsView(VIEW_MODES.GRID, WORKER_HASH, VIEW_MODES.TABLE)).toBe(VIEW_MODES.GRID);
  });

  it("gives cards for a saved view that the page has not", () => {
    expect(workerPoolsView(VIEW_MODES.COMPACT, "")).toBe(VIEW_MODES.GRID);
    expect(workerPoolsView("list" as ViewMode, "")).toBe(VIEW_MODES.GRID);
  });
});
