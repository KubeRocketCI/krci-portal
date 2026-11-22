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

export function FleetNotConfigured() {
  return (
    <EmptyList
      icon={<Bot size={64} className="text-muted-foreground" aria-hidden />}
      customText="Agent Substrate is not configured"
      description={`Set ${AGENT_SUBSTRATE_SETTING} on the portal server to show the fleet.`}
    />
  );
}

export function FleetUnreachable({ reason, message }: { reason: FleetUnreachableReason; message: string }) {
  return (
    <EmptyList
      icon={<Unplug size={64} className="text-muted-foreground" aria-hidden />}
      customText="Agent Substrate is unreachable"
      beforeLinkText={`Reason: ${UNREACHABLE_REASON_LABEL[reason]}`}
      description={message}
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
