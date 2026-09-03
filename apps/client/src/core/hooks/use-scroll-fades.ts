import * as React from "react";

/**
 * Fades for a horizontally scrollable region. `contentRef` is optional: attach the
 * element whose width can change without the container changing width, such as a table
 * with resized columns. Only attached elements are observed.
 */
export function useScrollFades<T extends HTMLElement, C extends HTMLElement = HTMLElement>() {
  const scrollRef = React.useRef<T>(null);
  const contentRef = React.useRef<C>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  const updateFades = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const hasOverflow = maxScrollLeft > 1;
    setShowLeftFade(hasOverflow && el.scrollLeft > 1);
    setShowRightFade(hasOverflow && el.scrollLeft < maxScrollLeft - 1);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(el);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    return () => {
      el.removeEventListener("scroll", updateFades);
      resizeObserver.disconnect();
    };
  }, [updateFades]);

  return { scrollRef, contentRef, showLeftFade, showRightFade };
}
