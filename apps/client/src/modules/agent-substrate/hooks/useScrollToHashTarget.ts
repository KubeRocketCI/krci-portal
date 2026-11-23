import React from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * The URL fragment, or null with none. The element with that id is scrolled into view once per fragment, when the
 * fragment or `rows` change and the element is there.
 */
export function useScrollToHashTarget(rows: readonly unknown[]): string | null {
  const hash = useRouterState({ select: (state) => state.location.hash });
  const target = hash || null;
  const scrolledTo = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (target === null || scrolledTo.current === target) return;
    const element = document.getElementById(target);
    if (!element) return;
    element.scrollIntoView({ block: "center" });
    scrolledTo.current = target;
  }, [target, rows]);

  return target;
}
