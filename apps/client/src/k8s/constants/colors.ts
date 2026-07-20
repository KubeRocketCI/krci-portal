export const MAIN_COLOR = {
  BLUE: "#0094FF",
  DARK_PURPLE: "#766f94",
  ORANGE: "#FF8A00",
  GREEN: "#18BE94",
  RED: "#FF005C",
  GREY: "#A2A7B7",
  // Darker neutral gray used only for the cancelled donut slice, so it stays
  // separable from the lighter "unknown" grey in that color-only context.
  DARK_GREY: "#6B7280",
} as const;

export const STATUS_COLOR = {
  SUCCESS: MAIN_COLOR.GREEN,
  ERROR: MAIN_COLOR.RED,
  SUSPENDED: MAIN_COLOR.DARK_PURPLE,
  IN_PROGRESS: MAIN_COLOR.BLUE,
  MISSING: MAIN_COLOR.ORANGE,
  UNKNOWN: MAIN_COLOR.GREY,
  // Light grey for badges/icons: a cancelled run is a non-event and must read as
  // muted — never more prominent than a green "Succeeded".
  CANCELLED: MAIN_COLOR.GREY,
} as const;

export const CHART_STATUS_COLOR = {
  SUCCESS: MAIN_COLOR.GREEN,
  ERROR: MAIN_COLOR.RED,
  SUSPENDED: MAIN_COLOR.DARK_PURPLE,
  IN_PROGRESS: MAIN_COLOR.BLUE,
  UNKNOWN: MAIN_COLOR.GREY,
  CANCELLED: MAIN_COLOR.DARK_GREY,
} as const;
