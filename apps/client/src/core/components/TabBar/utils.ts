import { EDGE_SCROLL_MAX_SPEED_PX_PER_S, EDGE_ZONE_MAX_PX, EDGE_ZONE_MAX_RATIO } from "./constants";

export function getEdgeZone(width: number): number {
  return Math.min(EDGE_ZONE_MAX_PX, width * EDGE_ZONE_MAX_RATIO);
}

/**
 * Speed in px/s for a pointer `distance` px from an edge.
 * Zero outside the zone, `max` at the edge, quadratic in between.
 */
export function getEdgeScrollSpeed(
  distance: number,
  zone: number,
  max: number = EDGE_SCROLL_MAX_SPEED_PX_PER_S
): number {
  if (zone <= 0 || distance >= zone) {
    return 0;
  }

  const closeness = (zone - Math.max(0, distance)) / zone;

  return max * closeness * closeness;
}

export interface ScrollViewport {
  scrollLeft: number;
  width: number;
  contentWidth: number;
}

/** Horizontal extent in the scroll content's coordinates. */
export interface ItemExtent {
  start: number;
  end: number;
}

/**
 * The `scrollLeft` that brings `item` fully into `view` with `margin` px clear of each edge,
 * clamped to the scrollable range, or `null` when no scroll is needed. An item wider than the
 * view is aligned by its start.
 */
export function getRevealScrollLeft(view: ScrollViewport, item: ItemExtent, margin: number): number | null {
  const visibleStart = view.scrollLeft + margin;
  const visibleEnd = view.scrollLeft + view.width - margin;

  let target: number;
  if (item.start < visibleStart) {
    target = item.start - margin;
  } else if (item.end > visibleEnd) {
    target = Math.min(item.end + margin - view.width, item.start - margin);
  } else {
    return null;
  }

  target = Math.min(Math.max(0, target), Math.max(0, view.contentWidth - view.width));

  return target === view.scrollLeft ? null : target;
}
