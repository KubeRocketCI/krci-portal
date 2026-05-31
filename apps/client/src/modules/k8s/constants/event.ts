// Kubernetes core Event `type` values.
export const EVENT_TYPE = {
  NORMAL: "Normal",
  WARNING: "Warning",
} as const;

// Tailwind background tone for an event indicator dot, keyed by Event `type`.
// Fall back to `bg-muted-foreground` for unknown types.
export const EVENT_TONE: Record<string, string> = {
  [EVENT_TYPE.NORMAL]: "bg-emerald-500",
  [EVENT_TYPE.WARNING]: "bg-amber-500",
};
