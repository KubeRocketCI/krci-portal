import { Activity, type ReactNode } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";

export type ActivityMode = "visible" | "hidden";

export type ActivityRenderResult = RenderResult & {
  setMode: (mode: ActivityMode) => void;
  reshow: () => void;
};

/**
 * Renders `renderUi()` inside `<Activity mode="visible">`. Every mode switch renders a fresh element.
 * `setMode` switches the mode; `reshow` hides, then shows again.
 */
export const renderInActivity = (renderUi: () => ReactNode, options?: RenderOptions): ActivityRenderResult => {
  const wrap = (mode: ActivityMode) => <Activity mode={mode}>{renderUi()}</Activity>;
  const view = render(wrap("visible"), options);
  const setMode = (mode: ActivityMode) => view.rerender(wrap(mode));
  const reshow = () => {
    setMode("hidden");
    setMode("visible");
  };
  return { ...view, setMode, reshow };
};
