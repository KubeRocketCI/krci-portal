import { useEffect } from "react";
import { readHorizontalScrollState } from "@/core/utils/horizontal-scroll";
import { EDGE_SCROLL_DELAY_MS, EDGE_SCROLL_MAX_FRAME_MS } from "../constants";
import { getEdgeScrollSpeed, getEdgeZone } from "../utils";

/**
 * Scrolls `row` while a mouse rests in one of its edge zones, faster closer to the edge.
 * Starts after the pointer dwells `EDGE_SCROLL_DELAY_MS` in a zone; stops on leaving the zone,
 * leaving the row, hiding the page, or reaching the end. Touch and pen input are ignored.
 * Off while `enabled` is false.
 */
export function useEdgeAutoScroll(row: HTMLElement | null, enabled: boolean) {
  useEffect(() => {
    if (!row || !enabled) {
      return;
    }

    let pointerX: number | null = null;
    let frameId: number | null = null;
    let dwellStartedAt: number | null = null;
    let lastTimestamp = 0;
    // Browsers may snap scrollLeft to whole pixels, so sub-pixel steps carry over to the next frame.
    let pendingDelta = 0;

    // Signed speed in px/s: negative scrolls left, positive scrolls right.
    const getVelocity = (): number => {
      if (pointerX === null) {
        return 0;
      }

      const { left, right, width } = row.getBoundingClientRect();
      const zone = getEdgeZone(width);
      const { canScrollLeft, canScrollRight } = readHorizontalScrollState(row);
      const leftSpeed = canScrollLeft ? getEdgeScrollSpeed(pointerX - left, zone) : 0;
      const rightSpeed = canScrollRight ? getEdgeScrollSpeed(right - pointerX, zone) : 0;

      return rightSpeed - leftSpeed;
    };

    const stop = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      dwellStartedAt = null;
      pendingDelta = 0;
    };

    const step = (timestamp: number) => {
      frameId = null;
      const velocity = getVelocity();
      if (velocity === 0) {
        stop();
        return;
      }

      if (dwellStartedAt === null) {
        dwellStartedAt = timestamp;
      }

      if (timestamp - dwellStartedAt >= EDGE_SCROLL_DELAY_MS) {
        const elapsedMs = Math.max(0, Math.min(timestamp - lastTimestamp, EDGE_SCROLL_MAX_FRAME_MS));
        pendingDelta += (velocity * elapsedMs) / 1000;
        const wholePixels = Math.round(pendingDelta);
        if (wholePixels !== 0) {
          row.scrollLeft += wholePixels;
          pendingDelta -= wholePixels;
        }
      }

      lastTimestamp = timestamp;
      frameId = requestAnimationFrame(step);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      pointerX = event.clientX;
      if (frameId === null && getVelocity() !== 0) {
        frameId = requestAnimationFrame(step);
      }
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

    row.addEventListener("pointermove", handlePointerMove);
    row.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      row.removeEventListener("pointermove", handlePointerMove);
      row.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
    };
  }, [row, enabled]);
}
