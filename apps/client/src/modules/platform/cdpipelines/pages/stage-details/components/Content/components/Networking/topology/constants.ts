// Node kinds + health tones for the Kiali-style exposure topology graph.

export const NET_NODE_KIND = {
  INTERNET: "internet",
  GATEWAY: "gateway",
  ROUTE: "route",
  INGRESS: "ingress",
  BACKEND: "backend",
  POD: "pod",
} as const;

export type NetNodeKind = (typeof NET_NODE_KIND)[keyof typeof NET_NODE_KIND];

export type Health = "green" | "amber" | "red" | "neutral";

/** Border + faint fill per health, applied to a node box. */
export const HEALTH_TONE: Record<Health, string> = {
  green: "border-green-500/50 bg-green-500/5",
  amber: "border-amber-500/60 bg-amber-500/5",
  red: "border-destructive/60 bg-destructive/5",
  neutral: "border-border bg-card",
};

/** Status dot color per health. */
export const HEALTH_DOT: Record<Health, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-destructive",
  neutral: "bg-muted-foreground/40",
};

/** CSS var consumed by the MiniMap nodeColor (read at render time for dark mode). */
export const HEALTH_CSS_VAR: Record<Health, string> = {
  green: "--color-green-500",
  amber: "--color-amber-500",
  red: "--destructive",
  neutral: "--muted-foreground",
};

export const LEGEND: Array<{ health: Health; label: string }> = [
  { health: "green", label: "Healthy" },
  { health: "amber", label: "Pending / AddressNotAssigned" },
  { health: "red", label: "Error" },
];
