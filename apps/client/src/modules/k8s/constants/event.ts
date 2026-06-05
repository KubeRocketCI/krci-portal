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

// Tailwind background tone for an event indicator dot, falling back to
// `bg-muted-foreground` for unknown/absent types.
export function eventToneClass(type?: string): string {
  return EVENT_TONE[type ?? ""] ?? "bg-muted-foreground";
}

// Poll interval (ms) for event views that fetch instead of watch. 30s keeps the
// UI fresh without streaming every event in the namespace/cluster.
export const EVENTS_POLL_INTERVAL_MS = 30_000;

// Max events fetched for the cluster-wide overview "Recent events" card (renders
// the newest 25). Core/v1 Events can't be sorted server-side, and `?limit` returns
// the first N in etcd key order (namespace/name), NOT the newest — so on clusters
// with more than this many live events the card can miss some recent ones. The gap
// is bounded by events' ~1h TTL; raise this limit if the overview needs higher
// fidelity (per-resource views are unaffected — the field selector scopes them).
export const OVERVIEW_EVENTS_FETCH_LIMIT = 100;

// Max events fetched for a single resource's detail/sidebar event views. A lone
// resource accrues few events, so this is generous headroom that still bounds the
// page (the involvedObject field selector already scopes it server-side).
export const RESOURCE_EVENTS_FETCH_LIMIT = 100;
