/** Admission operation recorded by krci-audit on an event. */
export type KrciAuditOperation = "CREATE" | "UPDATE" | "DELETE" | "CONNECT";

// Mirrors krci-audit's oapi.yaml `AuditEvent` (the lifted, searchable columns).
export interface KrciAuditEvent {
  eventUid: string;
  receivedAt: string;
  operation: KrciAuditOperation;
  apiGroup: string;
  apiVersion: string;
  resource: string;
  kind: string;
  subResource?: string | null;
  namespace: string;
  name: string;
  objectUid?: string | null;
  username: string;
  dryRun: boolean;
}

export interface KrciAuditEventsResponse {
  data: KrciAuditEvent[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
  };
}

export interface KrciAuditEventsQuery {
  actor?: string;
  operation?: KrciAuditOperation;
  group?: string;
  resource?: string;
  kind?: string;
  namespace?: string;
  name?: string;
  objectUid?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

/**
 * Raw shape of krci-audit's `GET /api/v1/audit/initiator` response
 * (the `Initiator` schema). `found: false` means the object was never audited — not an error.
 */
export interface KrciAuditInitiator {
  found: boolean;
  actor?: string;
  operation?: KrciAuditOperation;
  timestamp?: string;
}

/** Facet fields krci-audit can compute distinct values for (`operation` is a fixed enum, not a facet). */
export type KrciAuditFacetField = "namespace" | "kind" | "actor";

/**
 * Mirrors krci-audit's oapi.yaml `Facet` schema for one field's distinct values.
 * When `truncated` is true (> 50 distinct values), `values` is empty by design —
 * a partial dropdown that omits the caller's value would be worse than free text.
 */
export interface KrciAuditFacet {
  values: string[];
  truncated: boolean;
}

/** Mirrors krci-audit's `AuditFacetsResponse`: only the requested fields are present. */
export interface KrciAuditFacetsResponse {
  namespace?: KrciAuditFacet;
  kind?: KrciAuditFacet;
  actor?: KrciAuditFacet;
}

export type TriggeredByActorClass = "human" | "automation" | "unknown";

/** Portal-classified "Triggered By" result for one PipelineRun. */
export interface TriggeredBy {
  actorClass: TriggeredByActorClass;
  /** Raw krci-audit actor username (present when actorClass !== "unknown"). */
  actor?: string;
  /** Short display name for the hover tooltip: email for human, service-account short name for automation. */
  displayName?: string;
  /**
   * Set only when the result is a transient fallback (krci-audit or the RBAC check failed),
   * as opposed to a genuine "never audited" / "system:unknown" actor. Lets the client refetch
   * instead of caching the miss forever.
   */
  degraded?: boolean;
}
