import type { FleetUnreachableReason } from "@my-project/shared";
import { unreachableReasonLabel } from "../../../../../constants/unreachableReason";

export const NO_EGRESS_POLICY_TEXT = "The actor has no egress policy";

export const UNREADABLE_EGRESS_POLICY_TEXT = "The egress policy could not be read";

export const unreadableReasonText = (reason: FleetUnreachableReason) => `Reason: ${unreachableReasonLabel(reason)}.`;
