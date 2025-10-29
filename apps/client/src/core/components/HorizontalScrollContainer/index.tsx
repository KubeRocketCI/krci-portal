import React from "react";

export const HorizontalScrollContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const container = React.useRef<HTMLDivElement | null>(null);

  const handler = React.useCallback((e: WheelEvent) => {
    if (container.current) {
      if (
        (e.deltaY < 0 && container.current.scrollLeft > 0) ||
        (e.deltaY > 0 && container.current.scrollLeft < container.current.scrollWidth - container.current.clientWidth)
      ) {
        e.preventDefault();
        container.current.scrollLeft += e.deltaY;
      }
    }
  }, []);

  React.useEffect(() => {
    const el = container.current;
    if (el) {
      el.addEventListener("wheel", handler, { passive: false });
    }
    return () => {
      if (el) {
        el.removeEventListener("wheel", handler);
      }
    };
  }, [handler]);

  return (
    <div
      className="w-full flex items-center max-w-full overflow-x-auto overflow-y-hidden p-1"
      ref={container}
    >
      {children}
    </div>
  );
};
