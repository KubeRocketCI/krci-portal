import { Bot, Unplug } from "lucide-react";
import type { FleetUnreachableReason } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";

const AGENT_SUBSTRATE_SETTING = "AGENT_SUBSTRATE_URL";

const UNREACHABLE_REASON_LABEL: Record<FleetUnreachableReason, string> = {
  unavailable: "network or TLS failure",
  unauthenticated: "unauthenticated",
  permissionDenied: "permission denied",
  other: "other error",
};

const UNREACHABLE_DESCRIPTION = "See the portal server logs for the error.";

export function FleetNotConfigured() {
  return (
    <EmptyList
      icon={<Bot size={64} className="text-muted-foreground" aria-hidden />}
      customText="Agent Substrate is not configured"
      description={`Set ${AGENT_SUBSTRATE_SETTING} on the portal server to show the fleet.`}
    />
  );
}

interface FleetUnreachableProps {
  reason: FleetUnreachableReason;
}

export function FleetUnreachable({ reason }: FleetUnreachableProps) {
  return (
    <EmptyList
      icon={<Unplug size={64} className="text-muted-foreground" aria-hidden />}
      customText="Agent Substrate is unreachable"
      beforeLinkText={`Reason: ${UNREACHABLE_REASON_LABEL[reason]}`}
      description={UNREACHABLE_DESCRIPTION}
    />
  );
}

export function FleetEmpty() {
  return (
    <EmptyList
      icon={<Bot size={64} className="text-muted-foreground" aria-hidden />}
      customText="Agent Substrate has no atespaces yet"
      description="Agent Substrate is reachable. Actors appear here once an atespace holds them."
    />
  );
}

export function FleetLoading() {
  return (
    <div className="flex min-h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
