import * as React from "react";
import { readHorizontalScrollState } from "@/core/utils/horizontal-scroll";

/**
 * Fades for a horizontally scrollable `element`. Pass `null` while it is not mounted.
 * Recomputes on scroll and when the element or any of its direct children resizes, so
 * children that are added later or change width are covered.
 */
export function useScrollFades(element: HTMLElement | null) {
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  React.useEffect(() => {
    if (!element) {
      setShowLeftFade(false);
      setShowRightFade(false);
      return;
    }

    const updateFades = () => {
      const { canScrollLeft, canScrollRight } = readHorizontalScrollState(element);
      setShowLeftFade(canScrollLeft);
      setShowRightFade(canScrollRight);
    };

    const resizeObserver = new ResizeObserver(updateFades);
    const observeElementAndChildren = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(element);
      Array.from(element.children).forEach((child) => resizeObserver.observe(child));
    };
    const mutationObserver = new MutationObserver(() => {
      observeElementAndChildren();
      updateFades();
    });

    updateFades();
    observeElementAndChildren();
    mutationObserver.observe(element, { childList: true });
    element.addEventListener("scroll", updateFades, { passive: true });

    return () => {
      element.removeEventListener("scroll", updateFades);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [element]);

  return { showLeftFade, showRightFade };
}
