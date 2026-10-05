import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";
import { renderInActivity } from "@/test/utils/activity";
import { useActivityHiddenStyle } from "./useActivityHiddenStyle";

function StyleProbe({ style, log }: { style?: CSSProperties; log: (CSSProperties | undefined)[] }) {
  log.push(useActivityHiddenStyle(style));
  return null;
}

const renderProbe = (style?: CSSProperties) => {
  const log: (CSSProperties | undefined)[] = [];
  return { log, ...renderInActivity(() => <StyleProbe style={style} log={log} />) };
};

describe("useActivityHiddenStyle", () => {
  it("returns the given style while visible", () => {
    const style = { color: "red" };
    const { log } = renderProbe(style);

    expect(log.at(-1)).toBe(style);
  });

  it("adds display none while hidden and keeps the given style", () => {
    const { log, setMode } = renderProbe({ color: "red" });

    setMode("hidden");

    expect(log.at(-1)).toEqual({ color: "red", display: "none" });
  });

  it("returns the given style again when shown", () => {
    const style = { color: "red" };
    const { log, setMode } = renderProbe(style);

    setMode("hidden");
    setMode("visible");

    expect(log.at(-1)).toBe(style);
  });
});
