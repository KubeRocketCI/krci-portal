import { Unplug } from "lucide-react";
import type { FleetUnreachableReason } from "@my-project/shared";
import FactoryIcon from "@/assets/icons/common/factory.svg?react";
import { EmptyList } from "@/core/components/EmptyList";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { unreachableReasonLabel } from "../../constants/unreachableReason";

const AGENT_SUBSTRATE_SETTING = "AGENT_SUBSTRATE_URL";

const UNREACHABLE_DESCRIPTION = "See the portal server logs for the error.";

export function FleetNotConfigured() {
  return (
    <EmptyList
      icon={<FactoryIcon className="text-muted-foreground size-16" aria-hidden />}
      customText="Factory is not configured"
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
      customText="Factory is unreachable"
      beforeLinkText={`Reason: ${unreachableReasonLabel(reason)}`}
      description={UNREACHABLE_DESCRIPTION}
    />
  );
}

export function FleetEmpty() {
  return (
    <EmptyList
      icon={<FactoryIcon className="text-muted-foreground size-16" aria-hidden />}
      customText="Factory has no atespaces yet"
      description="Factory is reachable. Actors appear here once an atespace holds them."
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
