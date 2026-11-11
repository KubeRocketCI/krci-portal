import { useEffect, useSyncExternalStore } from "react";

export const EDGE_ZONE_MAX_PX = 80;
const EDGE_ZONE_MAX_RATIO = 0.25;
export const EDGE_SCROLL_MAX_SPEED = 600;
const EDGE_SCROLL_MAX_FRAME_MS = 50;

const OVERFLOW_TOLERANCE_PX = 1;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface EdgeScrollState {
  hasOverflow: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export function getEdgeZone(width: number): number {
  return Math.min(EDGE_ZONE_MAX_PX, width * EDGE_ZONE_MAX_RATIO);
}

/**
 * Speed in px/s for a pointer `distance` px from an edge.
 * Zero outside the zone, `max` at the edge, quadratic in between.
 */
export function getEdgeScrollSpeed(distance: number, zone: number, max: number = EDGE_SCROLL_MAX_SPEED): number {
  if (zone <= 0 || distance >= zone) {
    return 0;
  }

  const closeness = (zone - Math.max(0, distance)) / zone;

  return max * closeness * closeness;
}

export function readEdgeScrollState(element: HTMLElement): EdgeScrollState {
  const { scrollLeft, clientWidth, scrollWidth } = element;

  return {
    hasOverflow: scrollWidth - clientWidth > OVERFLOW_TOLERANCE_PX,
    canScrollLeft: scrollLeft > OVERFLOW_TOLERANCE_PX,
    canScrollRight: scrollLeft + clientWidth < scrollWidth - OVERFLOW_TOLERANCE_PX,
  };
}

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, () => false);
}

interface UseEdgeScrollOptions {
  /** Index of the child to keep in view, such as the active tab. */
  activeIndex?: number;
  /** Re-checks the active child when the number of children changes. */
  itemCount?: number;
}

/**
 * Makes a horizontally overflowing element easier to reach: mouse edge auto-scroll, and the
 * active and keyboard-focused children kept in view. `element` is state, not a ref, so an
 * element that mounts after the first render is picked up; pass `null` while it is absent.
 * Auto-scroll is off under `prefers-reduced-motion`.
 */
export function useEdgeScroll(element: HTMLElement | null, { activeIndex, itemCount }: UseEdgeScrollOptions = {}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!element || activeIndex === undefined || !readEdgeScrollState(element).hasOverflow) {
      return;
    }

    element.children[activeIndex]?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [element, activeIndex, itemCount, prefersReducedMotion]);

  useEffect(() => {
    if (!element) {
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target !== element && readEdgeScrollState(element).hasOverflow) {
        event.target.scrollIntoView({ inline: "nearest", block: "nearest" });
      }
    };

    element.addEventListener("focusin", handleFocusIn);

    return () => element.removeEventListener("focusin", handleFocusIn);
  }, [element]);

  useEffect(() => {
    if (!element || prefersReducedMotion) {
      return;
    }

    let pointerX: number | null = null;
    let frameId: number | null = null;
    let lastTimestamp = 0;
    // Browsers may snap scrollLeft to whole pixels, so sub-pixel steps are carried over to the next frame.
    let pendingDelta = 0;

    // Signed speed in px/s: negative scrolls left, positive scrolls right.
    const getVelocity = (): number => {
      if (pointerX === null) {
        return 0;
      }

      const { left, right, width } = element.getBoundingClientRect();
      const zone = getEdgeZone(width);
      const { canScrollLeft, canScrollRight } = readEdgeScrollState(element);

      // The zones are at most a quarter of the width each, so they never overlap.
      const leftSpeed = canScrollLeft ? getEdgeScrollSpeed(pointerX - left, zone) : 0;
      const rightSpeed = canScrollRight ? getEdgeScrollSpeed(right - pointerX, zone) : 0;

      return rightSpeed - leftSpeed;
    };

    const stop = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      pendingDelta = 0;
    };

    const step = (timestamp: number) => {
      const velocity = getVelocity();
      if (velocity === 0) {
        frameId = null;
        pendingDelta = 0;
        return;
      }

      const elapsedMs = Math.max(0, Math.min(timestamp - lastTimestamp, EDGE_SCROLL_MAX_FRAME_MS));
      lastTimestamp = timestamp;
      pendingDelta += (velocity * elapsedMs) / 1000;
      const wholePixels = Math.round(pendingDelta);
      if (wholePixels !== 0) {
        element.scrollLeft += wholePixels;
        pendingDelta -= wholePixels;
      }
      frameId = requestAnimationFrame(step);
    };

    const start = () => {
      if (frameId !== null || getVelocity() === 0) {
        return;
      }

      lastTimestamp = performance.now();
      frameId = requestAnimationFrame(step);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      pointerX = event.clientX;
      start();
    };

    const handlePointerLeave = () => {
      pointerX = null;
      stop();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handlePointerLeave();
      }
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
    };
  }, [element, prefersReducedMotion]);
}
