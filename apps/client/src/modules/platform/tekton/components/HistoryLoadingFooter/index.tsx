import { Button } from "@/core/components/ui/button";
import { ChevronDown, Loader2, RotateCw } from "lucide-react";
import type { HistoryQuery } from "../../hooks/useUnifiedPipelineRunList";
import { useLoadOlderRuns } from "./hooks/useLoadOlderRuns";

interface HistoryLoadingFooterProps {
  isHistoryLoading: boolean;
  historyQuery: HistoryQuery;
  /** History rows the table renders after client-side filters. Drives the "Load older runs" baseline. */
  visibleHistoryCount: number;
}

/**
 * Archive action for the unified pipeline run list, right-aligned where the table pager would sit.
 * Renders nothing when the archive has nothing to offer and nothing to report.
 */
export function HistoryLoadingFooter({
  isHistoryLoading,
  historyQuery,
  visibleHistoryCount,
}: HistoryLoadingFooterProps) {
  const { isError, hasNextPage, refetch } = historyQuery;
  const { loadOlderRuns, isLoadingOlderRuns } = useLoadOlderRuns({ historyQuery, visibleHistoryCount });

  const content = (() => {
    if (isHistoryLoading) {
      return (
        <span className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading older runs…
        </span>
      );
    }

    if (isError) {
      return (
        <span className="flex items-center gap-3" role="alert">
          <span className="text-destructive text-sm">Older runs didn't load</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RotateCw className="h-4 w-4" />
            Retry
          </Button>
        </span>
      );
    }

    if (hasNextPage) {
      return (
        <Button variant="outline" size="sm" onClick={loadOlderRuns} disabled={isLoadingOlderRuns}>
          {isLoadingOlderRuns ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
          {isLoadingOlderRuns ? "Loading…" : "Load older runs"}
        </Button>
      );
    }

    if (visibleHistoryCount > 0) {
      return (
        <span className="text-muted-foreground text-sm" role="status">
          All runs loaded
        </span>
      );
    }

    return null;
  })();

  if (!content) return null;

  return <div className="flex min-h-8 items-center justify-end px-5 pb-5">{content}</div>;
}
