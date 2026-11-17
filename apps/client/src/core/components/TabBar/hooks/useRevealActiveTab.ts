import { useEffect, useRef } from "react";
import { readHorizontalScrollState } from "@/core/utils/horizontal-scroll";
import { FADE_WIDTH_PX } from "../constants";
import { getRevealScrollLeft } from "../utils";

function revealChild(row: HTMLElement, child: Element, behavior: ScrollBehavior) {
  if (!readHorizontalScrollState(row).hasOverflow) {
    return;
  }

  const rowLeft = row.getBoundingClientRect().left + row.clientLeft;
  const childRect = child.getBoundingClientRect();
  const left = getRevealScrollLeft(
    { scrollLeft: row.scrollLeft, width: row.clientWidth, contentWidth: row.scrollWidth },
    { start: childRect.left - rowLeft + row.scrollLeft, end: childRect.right - rowLeft + row.scrollLeft },
    FADE_WIDTH_PX
  );
  if (left !== null) {
    row.scrollTo({ left, behavior });
  }
}

/**
 * Scrolls `row` horizontally so a child is fully visible and clear of the fades: the child at
 * `activeIndex` on mount, on index change and when `itemCount` changes, and any child that
 * receives focus while no pointer is pressed. Scrolls `row` only, never the page. The first
 * reveal for an element and focus reveals are instant; later active reveals are smooth unless
 * `reducedMotion`.
 */
export function useRevealActiveTab(
  row: HTMLElement | null,
  activeIndex: number,
  itemCount: number,
  reducedMotion: boolean
) {
  const revealedRowRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!row) {
      return;
    }

    const isFirstReveal = revealedRowRef.current !== row;
    revealedRowRef.current = row;

    const child = row.children[activeIndex];
    if (child) {
      revealChild(row, child, isFirstReveal || reducedMotion ? "auto" : "smooth");
    }
  }, [row, activeIndex, itemCount, reducedMotion]);

  useEffect(() => {
    if (!row) {
      return;
    }

    // A pressed button focuses on pointerdown; scrolling then would move the tab away before
    // pointerup and cancel the click. Pointer activation is revealed through `activeIndex`.
    let isPointerDown = false;
    const handlePointerDown = () => {
      isPointerDown = true;
    };
    const handlePointerRelease = () => {
      isPointerDown = false;
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!isPointerDown && event.target instanceof Element && event.target.parentElement === row) {
        revealChild(row, event.target, "auto");
      }
    };

    row.addEventListener("pointerdown", handlePointerDown);
    row.addEventListener("focusin", handleFocusIn);
    window.addEventListener("pointerup", handlePointerRelease, true);
    window.addEventListener("pointercancel", handlePointerRelease, true);

    return () => {
      row.removeEventListener("pointerdown", handlePointerDown);
      row.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("pointerup", handlePointerRelease, true);
      window.removeEventListener("pointercancel", handlePointerRelease, true);
    };
  }, [row]);
}
