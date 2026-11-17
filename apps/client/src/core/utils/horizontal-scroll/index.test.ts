import { describe, expect, it } from "vitest";
import { readHorizontalScrollState } from "./index";

describe("readHorizontalScrollState", () => {
  const metrics = (scrollLeft: number, clientWidth: number, scrollWidth: number) => ({
    scrollLeft,
    clientWidth,
    scrollWidth,
  });

  it("reports no overflow when the content fits", () => {
    expect(readHorizontalScrollState(metrics(0, 400, 400))).toEqual({
      hasOverflow: false,
      canScrollLeft: false,
      canScrollRight: false,
    });
  });

  it("ignores a one pixel rounding difference", () => {
    expect(readHorizontalScrollState(metrics(0, 400, 401))).toEqual({
      hasOverflow: false,
      canScrollLeft: false,
      canScrollRight: false,
    });
  });

  it("can only scroll right at the start", () => {
    expect(readHorizontalScrollState(metrics(0, 400, 900))).toEqual({
      hasOverflow: true,
      canScrollLeft: false,
      canScrollRight: true,
    });
  });

  it("can scroll both ways in the middle", () => {
    expect(readHorizontalScrollState(metrics(200, 400, 900))).toMatchObject({
      canScrollLeft: true,
      canScrollRight: true,
    });
  });

  it("can only scroll left at the end", () => {
    expect(readHorizontalScrollState(metrics(500, 400, 900))).toMatchObject({
      canScrollLeft: true,
      canScrollRight: false,
    });
  });
});
