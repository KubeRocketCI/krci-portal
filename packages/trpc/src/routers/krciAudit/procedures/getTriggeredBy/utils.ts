import type { KrciAuditInitiator, TriggeredBy } from "@my-project/shared";

// Mirrors the ServiceAccount-username convention already parsed in
// mapSelfSubjectReviewToOIDCUser, and krci-audit's identity rules
// (system: prefix => automation, system:unknown => unresolved sentinel).
const SERVICE_ACCOUNT_PATTERN = /^system:serviceaccount:([^:]+):([^:]+)$/;
const SYSTEM_PREFIX = "system:";
const UNKNOWN_SENTINEL = "system:unknown";

/**
 * Classifies a krci-audit initiator lookup into the Portal's "Triggered By" shape:
 * human (avatar/initials), automation (robot indicator), or unknown (placeholder).
 */
export function classifyTriggeredByActor(initiator: KrciAuditInitiator): TriggeredBy {
  const { found, actor } = initiator;

  if (!found || !actor || actor === UNKNOWN_SENTINEL) {
    return { actorClass: "unknown" };
  }

  const serviceAccountMatch = actor.match(SERVICE_ACCOUNT_PATTERN);
  if (serviceAccountMatch) {
    return { actorClass: "automation", actor, displayName: serviceAccountMatch[2] };
  }

  if (actor.startsWith(SYSTEM_PREFIX)) {
    return { actorClass: "automation", actor, displayName: actor };
  }

  return { actorClass: "human", actor, displayName: actor };
}
