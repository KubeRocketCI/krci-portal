import { describe, expect, it } from "vitest";
import { EDGE_SCROLL_MAX_SPEED_PX_PER_S, EDGE_ZONE_MAX_PX } from "./constants";
import { getEdgeScrollSpeed, getEdgeZone, getRevealScrollLeft } from "./utils";

describe("getEdgeZone", () => {
  it("caps the zone at the maximum width", () => {
    expect(getEdgeZone(1000)).toBe(EDGE_ZONE_MAX_PX);
  });

  it("uses a quarter of a narrow row", () => {
    expect(getEdgeZone(120)).toBe(30);
  });
});

describe("getEdgeScrollSpeed", () => {
  const zone = 48;

  it("is zero outside the zone", () => {
    expect(getEdgeScrollSpeed(zone, zone)).toBe(0);
    expect(getEdgeScrollSpeed(zone + 40, zone)).toBe(0);
  });

  it("is the maximum at and beyond the edge", () => {
    expect(getEdgeScrollSpeed(0, zone)).toBe(EDGE_SCROLL_MAX_SPEED_PX_PER_S);
    expect(getEdgeScrollSpeed(-10, zone)).toBe(EDGE_SCROLL_MAX_SPEED_PX_PER_S);
  });

  it("grows quadratically towards the edge", () => {
    expect(getEdgeScrollSpeed(zone / 2, zone)).toBe(EDGE_SCROLL_MAX_SPEED_PX_PER_S / 4);
  });

  it("is zero for an empty zone", () => {
    expect(getEdgeScrollSpeed(0, 0)).toBe(0);
    expect(getEdgeScrollSpeed(0, -5)).toBe(0);
  });

  it("honours a custom maximum", () => {
    expect(getEdgeScrollSpeed(0, zone, 100)).toBe(100);
  });
});

describe("getRevealScrollLeft", () => {
  const view = (scrollLeft: number) => ({ scrollLeft, width: 300, contentWidth: 1000 });
  const margin = 32;

  it("returns null for an item clear of both edges", () => {
    expect(getRevealScrollLeft(view(0), { start: 100, end: 200 }, margin)).toBeNull();
  });

  it("aligns an item past the right edge to the right, clear of the fade", () => {
    expect(getRevealScrollLeft(view(0), { start: 250, end: 350 }, margin)).toBe(82);
  });

  it("aligns an item past the left edge to the left, clear of the fade", () => {
    expect(getRevealScrollLeft(view(400), { start: 380, end: 480 }, margin)).toBe(348);
  });

  it("treats an item under a fade as hidden", () => {
    expect(getRevealScrollLeft(view(0), { start: 150, end: 290 }, margin)).toBe(22);
  });

  it("aligns an item wider than the view by its start", () => {
    expect(getRevealScrollLeft(view(0), { start: 100, end: 500 }, margin)).toBe(68);
  });

  it("clamps to the start of the content", () => {
    expect(getRevealScrollLeft(view(20), { start: 0, end: 100 }, margin)).toBe(0);
  });

  it("clamps to the end of the content", () => {
    expect(getRevealScrollLeft(view(500), { start: 900, end: 1000 }, margin)).toBe(700);
  });

  it("returns null when the clamped target is the current position", () => {
    expect(getRevealScrollLeft(view(0), { start: 0, end: 100 }, margin)).toBeNull();
    expect(getRevealScrollLeft(view(700), { start: 900, end: 1000 }, margin)).toBeNull();
  });
});
