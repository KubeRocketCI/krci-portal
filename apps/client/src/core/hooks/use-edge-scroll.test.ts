import { describe, expect, it } from "vitest";
import {
  EDGE_SCROLL_MAX_SPEED,
  EDGE_ZONE_MAX_PX,
  getEdgeScrollSpeed,
  getEdgeZone,
  readEdgeScrollState,
} from "./use-edge-scroll";

describe("getEdgeZone", () => {
  it("caps the zone at the maximum width", () => {
    expect(getEdgeZone(1000)).toBe(EDGE_ZONE_MAX_PX);
  });

  it("uses a quarter of a narrow row", () => {
    expect(getEdgeZone(200)).toBe(50);
  });
});

describe("getEdgeScrollSpeed", () => {
  const zone = 80;

  it("is zero outside the zone", () => {
    expect(getEdgeScrollSpeed(zone, zone)).toBe(0);
    expect(getEdgeScrollSpeed(zone + 40, zone)).toBe(0);
  });

  it("is the maximum at the edge", () => {
    expect(getEdgeScrollSpeed(0, zone)).toBe(EDGE_SCROLL_MAX_SPEED);
    expect(getEdgeScrollSpeed(-10, zone)).toBe(EDGE_SCROLL_MAX_SPEED);
  });

  it("grows quadratically towards the edge", () => {
    expect(getEdgeScrollSpeed(zone / 2, zone)).toBe(EDGE_SCROLL_MAX_SPEED / 4);
  });

  it("never decreases while the pointer approaches the edge", () => {
    const speeds = [70, 50, 30, 10, 0].map((distance) => getEdgeScrollSpeed(distance, zone));

    expect(speeds).toEqual([...speeds].sort((a, b) => a - b));
  });

  it("is zero for an empty zone", () => {
    expect(getEdgeScrollSpeed(0, 0)).toBe(0);
    expect(getEdgeScrollSpeed(0, -5)).toBe(0);
  });

  it("honours a custom maximum", () => {
    expect(getEdgeScrollSpeed(0, zone, 100)).toBe(100);
  });
});

describe("readEdgeScrollState", () => {
  const row = (scrollLeft: number, clientWidth: number, scrollWidth: number) =>
    ({ scrollLeft, clientWidth, scrollWidth }) as HTMLElement;

  it("reports no overflow when the content fits", () => {
    expect(readEdgeScrollState(row(0, 400, 400))).toEqual({
      hasOverflow: false,
      canScrollLeft: false,
      canScrollRight: false,
    });
  });

  it("ignores a one pixel rounding difference", () => {
    expect(readEdgeScrollState(row(0, 400, 401)).hasOverflow).toBe(false);
  });

  it("can only scroll right at the start", () => {
    expect(readEdgeScrollState(row(0, 400, 900))).toEqual({
      hasOverflow: true,
      canScrollLeft: false,
      canScrollRight: true,
    });
  });

  it("can scroll both ways in the middle", () => {
    expect(readEdgeScrollState(row(200, 400, 900))).toMatchObject({ canScrollLeft: true, canScrollRight: true });
  });

  it("can only scroll left at the end", () => {
    expect(readEdgeScrollState(row(500, 400, 900))).toMatchObject({ canScrollLeft: true, canScrollRight: false });
  });
});
