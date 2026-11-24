import type { FleetUnreachableReason } from "@my-project/shared";

const UNREACHABLE_REASON_LABEL: Record<FleetUnreachableReason, string> = {
  unavailable: "network or TLS failure",
  unauthenticated: "unauthenticated",
  permissionDenied: "permission denied",
  other: "other error",
};

/** A reason this client does not know reads as `other`: a tab can outlive a deploy that adds one. */
export const unreachableReasonLabel = (reason: FleetUnreachableReason): string =>
  UNREACHABLE_REASON_LABEL[reason] ?? UNREACHABLE_REASON_LABEL.other;
