import * as React from "react";

export function useScrollFades<T extends HTMLElement>() {
  const scrollRef = React.useRef<T>(null);
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
    return () => {
      el.removeEventListener("scroll", updateFades);
      resizeObserver.disconnect();
    };
  }, [updateFades]);

  return { scrollRef, showLeftFade, showRightFade };
}
