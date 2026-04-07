import * as React from "react";

const NARROW_BREAKPOINT = 1024;

export function useIsNarrow() {
  const [isNarrow, setIsNarrow] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsNarrow(window.innerWidth < NARROW_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsNarrow(window.innerWidth < NARROW_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isNarrow;
}
