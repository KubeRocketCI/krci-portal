import humanizeDuration from "humanize-duration";

// Disable hot module replacement for this file to prevent humanizer issues
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // Do nothing - effectively disables hot reload for this module
  });
}

export const humanize = humanizeDuration.humanizer();

humanize.languages["en-mini"] = {
  y: () => "y",
  mo: () => "mo",
  w: () => "w",
  d: () => "d",
  h: () => "h",
  m: () => "m",
  s: () => "s",
  ms: () => "ms",
};

export { HUMANIZE_DURATION_OPTIONS } from "./constants";
export { formatTimestamp, formatDuration } from "./utils";
