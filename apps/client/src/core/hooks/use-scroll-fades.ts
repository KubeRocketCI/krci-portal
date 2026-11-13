import * as React from "react";
import { readEdgeScrollState } from "./use-edge-scroll";

/**
 * Fades for a horizontally scrollable region. Both refs are callback refs, so elements that
 * mount after the first render are picked up. `contentRef` is optional: attach the element
 * whose width can change without the container changing width, such as a table with resized
 * columns. The children of the container are observed too. `scrollElement` is the attached
 * container, for hooks that act on the same element.
 */
export function useScrollFades<T extends HTMLElement, C extends HTMLElement = HTMLElement>() {
  const [scrollElement, setScrollElement] = React.useState<T | null>(null);
  const [contentElement, setContentElement] = React.useState<C | null>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  React.useEffect(() => {
    const el = scrollElement;
    if (!el) {
      setShowLeftFade(false);
      setShowRightFade(false);
      return;
    }

    const updateFades = () => {
      const { hasOverflow, canScrollLeft, canScrollRight } = readEdgeScrollState(el);
      setShowLeftFade(hasOverflow && canScrollLeft);
      setShowRightFade(hasOverflow && canScrollRight);
    };

    const resizeObserver = new ResizeObserver(updateFades);
    const observeContent = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(el);
      Array.from(el.children).forEach((child) => resizeObserver.observe(child));
      if (contentElement) {
        resizeObserver.observe(contentElement);
      }
    };
    const mutationObserver = new MutationObserver(() => {
      observeContent();
      updateFades();
    });

    updateFades();
    observeContent();
    mutationObserver.observe(el, { childList: true });
    el.addEventListener("scroll", updateFades, { passive: true });

    return () => {
      el.removeEventListener("scroll", updateFades);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [scrollElement, contentElement]);

  return {
    scrollRef: setScrollElement as React.RefCallback<T>,
    contentRef: setContentElement as React.RefCallback<C>,
    scrollElement,
    showLeftFade,
    showRightFade,
  };
}
