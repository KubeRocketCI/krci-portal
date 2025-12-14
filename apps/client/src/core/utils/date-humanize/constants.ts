import type { HumanizerOptions } from "humanize-duration";

/**
 * Default options for humanize duration formatting
 * Used consistently across the application for duration display
 */
export const HUMANIZE_DURATION_OPTIONS: HumanizerOptions = {
  language: "en-mini",
  spacer: "",
  delimiter: " ",
  fallbacks: ["en"],
  largest: 2,
  round: true,
  units: ["d", "h", "m", "s"],
} as const;
