/** Admission operation recorded by krci-audit on an event. */
export type KrciAuditOperation = "CREATE" | "UPDATE" | "DELETE" | "CONNECT";

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
