import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { formatUnixTimestamp } from "@/core/utils/date-humanize";
import { cn } from "@/core/utils/classname";

const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "numeric", second: "numeric" };

interface FleetFreshnessProps {
  /** Epoch ms or ISO 8601. */
  updatedAt?: number | string;
  isStale: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

export function FleetFreshness({ updatedAt, isStale, isFetching, onRefresh }: FleetFreshnessProps) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs whitespace-nowrap">
      {!!updatedAt && (
        <span className="flex items-center gap-1">
          {isStale && <AlertTriangle className="size-3.5 text-amber-500" aria-label="Refresh failed" />}
          Last updated {formatUnixTimestamp(updatedAt, TIME_FORMAT)}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRefresh}
        disabled={isFetching}
        aria-label="Refresh Agent Substrate data"
      >
        <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} aria-hidden />
      </Button>
    </div>
  );
}
