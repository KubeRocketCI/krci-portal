import { CircleCheck, CircleDashed, RefreshCw, Unplug } from "lucide-react";
import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Alert } from "@/core/components/ui/alert";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { DEFECTDOJO_STATE_TEXT } from "../constants";
import { formatScanTime } from "../utils";

/** The portal server has no DefectDojo URL or token. One block for the whole view. */
export function NotConfiguredState() {
  return (
    <div className="flex flex-col items-center gap-2">
      <EmptyList
        customText={DEFECTDOJO_STATE_TEXT.notConfigured}
        description="The portal has no DefectDojo connection. Set the DefectDojo URL in the portal chart values and the token in the portal secret."
        icon={<Unplug className="text-muted-foreground size-16" aria-hidden />}
        linkText=""
      />
      <LearnMoreLink url={EDP_OPERATOR_GUIDE.DEFECT_DOJO.url} />
    </div>
  );
}

interface RetryAlertProps {
  title: string;
  message: string;
  onRetry: () => void;
  /** The retry is running. */
  isRetrying: boolean;
}

function RetryAlert({ title, message, onRetry, isRetrying }: RetryAlertProps) {
  return (
    <Alert variant="destructive" title={title}>
      <div className="flex flex-col items-start gap-2">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          <RefreshCw aria-hidden />
          Retry
        </Button>
      </div>
    </Alert>
  );
}

export interface RetryIconButtonProps {
  onRetry: () => void;
  isRetrying: boolean;
  className?: string;
}

/** Retry in a one-line view; the blocks have a Retry button with its label. */
export function RetryIconButton({ onRetry, isRetrying, className }: RetryIconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className={className}
      onClick={onRetry}
      disabled={isRetrying}
      aria-label="Retry"
    >
      <RefreshCw className={cn("size-3.5", isRetrying && "animate-spin")} aria-hidden />
    </Button>
  );
}

export interface UnreachableStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
  /** Names the part that failed. */
  what?: string;
  wholePage?: boolean;
}

/** DefectDojo is down, timed out or rejected the token. Says nothing of the address or the token. */
export function UnreachableState({
  onRetry,
  isRetrying = false,
  what = "Security findings",
  wholePage = false,
}: UnreachableStateProps) {
  return (
    <RetryAlert
      title={DEFECTDOJO_STATE_TEXT.unreachable}
      message={
        wholePage ? `${what} cannot be loaded.` : `${what} cannot be loaded. The rest of the page is not affected.`
      }
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  );
}

export interface LoadFailedStateProps {
  /** The message of the error. */
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

/** The server could not answer: a failure that is none of the DefectDojo states, such as a denied Kubernetes read. */
export function LoadFailedState({ message, onRetry, isRetrying = false }: LoadFailedStateProps) {
  return (
    <RetryAlert title={DEFECTDOJO_STATE_TEXT.loadFailed} message={message} onRetry={onRetry} isRetrying={isRetrying} />
  );
}

export interface NoScanDataStateProps {
  /** What writes the data to DefectDojo, for example "CI security scan". */
  producer: string;
  /** What has no data, for example "Code findings". */
  what: string;
  subject?: string;
  hint?: string;
  className?: string;
}

/** No scan reached DefectDojo. Names the producer so that the reader knows what to run. */
export function NoScanDataState({ producer, what, subject = "this codebase", hint, className }: NoScanDataStateProps) {
  return (
    <div className={cn("text-muted-foreground flex items-start gap-2", className)}>
      <CircleDashed className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="text-foreground font-medium">{DEFECTDOJO_STATE_TEXT.noScanData}</p>
        <p className="text-xs">
          The {producer} has not reported {what} for {subject}.
        </p>
        {hint && <p className="text-xs">{hint}</p>}
      </div>
    </div>
  );
}

/** A scan that ran and reported no active finding. Never used for "no scan data". */
export function NoFindingsBadge({
  label = DEFECTDOJO_STATE_TEXT.noFindings,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Badge variant="success" className={className}>
      <CircleCheck aria-hidden />
      {label}
    </Badge>
  );
}

export function CleanLevelState({ lastUpload }: { lastUpload: string | null }) {
  return (
    <>
      <NoFindingsBadge />
      <span className="text-muted-foreground">Last upload {formatScanTime(lastUpload)}</span>
    </>
  );
}
