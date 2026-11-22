// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { CircleCheck, CircleDashed, PlugZap, RefreshCw, Unplug } from "lucide-react";
import type { PrototypeDefectDojoLevel } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { PROTOTYPE_LEVEL_META } from "../constants";

/** State "not configured": the portal server has no DefectDojo URL or token. One block for the whole view. */
export function NotConfiguredState() {
  return (
    <div className="flex flex-col items-center gap-2" data-testid="defectdojo-not-configured">
      <EmptyList
        customText="DefectDojo is not connected"
        description="The portal server has no DefectDojo connection. Set the DefectDojo URL and token in the portal chart values."
        icon={<Unplug className="text-muted-foreground size-16" aria-hidden />}
        linkText=""
      />
      <LearnMoreLink url={EDP_OPERATOR_GUIDE.DEFECT_DOJO.url} />
    </div>
  );
}

export interface UnreachableStateProps {
  onRetry: () => void;
  /** Names the part that failed, for example "Runtime findings". */
  what?: string;
  compact?: boolean;
}

/** State "unreachable": DefectDojo is down, timed out or rejected the token. No URL or token detail. */
export function UnreachableState({ onRetry, what = "Security findings", compact = false }: UnreachableStateProps) {
  return (
    <div
      role="alert"
      data-testid="defectdojo-unreachable"
      className={cn(
        "border-destructive bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg border",
        compact ? "flex-col items-start p-3" : "p-4"
      )}
    >
      <PlugZap className="size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">DefectDojo is unreachable</p>
        <p className="text-destructive/90 text-xs">{what} cannot be loaded. The rest of the page is not affected.</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw aria-hidden />
        Retry
      </Button>
    </div>
  );
}

export interface NoScanDataStateProps {
  level: PrototypeDefectDojoLevel;
  /** What has no data. Default: "this codebase". */
  subject?: string;
  /** Extra fact, for example "Not deployed to any Environment". */
  hint?: string;
  className?: string;
}

/** State "no scan data" of one level. Names the producer of the level. */
export function NoScanDataState({ level, subject = "this codebase", hint, className }: NoScanDataStateProps) {
  const meta = PROTOTYPE_LEVEL_META[level];

  return (
    <div
      data-testid={`defectdojo-no-scan-data-${level}`}
      className={cn(
        "border-border text-muted-foreground flex items-start gap-2 rounded border border-dashed p-3",
        className
      )}
    >
      <CircleDashed className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="text-foreground font-medium">No scan data</p>
        <p className="text-xs">
          The {meta.producer} has not reported {meta.label} findings for {subject}.
        </p>
        {hint && <p className="text-xs">{hint}</p>}
      </div>
    </div>
  );
}

/** A scan that ran and found nothing. Never used for "no scan data". */
export function CleanScanBadge({ className }: { className?: string }) {
  return (
    <Badge variant="success" className={className}>
      <CircleCheck aria-hidden />
      Clean
    </Badge>
  );
}
