// Matches the `w-8` width of the edge fades.
export const FADE_WIDTH_PX = 32;

export const EDGE_ZONE_MAX_PX = 48;
// Keeps the two zones from overlapping on narrow rows.
export const EDGE_ZONE_MAX_RATIO = 0.25;
export const EDGE_SCROLL_MAX_SPEED_PX_PER_S = 600;
// Pointer dwell in an edge zone before scrolling starts; a quick click on an edge tab must not move it.
export const EDGE_SCROLL_DELAY_MS = 250;
// Caps the step after a dropped or throttled frame.
export const EDGE_SCROLL_MAX_FRAME_MS = 50;
