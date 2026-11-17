// Sub-pixel layout can leave scrollWidth one pixel above clientWidth on content that fits.
const OVERFLOW_TOLERANCE_PX = 1;

export interface HorizontalScrollState {
  hasOverflow: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export type HorizontalScrollMetrics = Pick<HTMLElement, "scrollLeft" | "clientWidth" | "scrollWidth">;

export function readHorizontalScrollState({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: HorizontalScrollMetrics): HorizontalScrollState {
  return {
    hasOverflow: scrollWidth - clientWidth > OVERFLOW_TOLERANCE_PX,
    canScrollLeft: scrollLeft > OVERFLOW_TOLERANCE_PX,
    canScrollRight: scrollLeft + clientWidth < scrollWidth - OVERFLOW_TOLERANCE_PX,
  };
}
