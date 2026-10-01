import { Button } from "@/core/components/ui/button";
import { ChevronDown, Loader2, RotateCw } from "lucide-react";
import type { HistoryQuery } from "../../hooks/useUnifiedPipelineRunList";
import { useLoadOlderRuns } from "./hooks/useLoadOlderRuns";

interface HistoryLoadingFooterProps {
  isHistoryLoading: boolean;
  historyQuery: HistoryQuery;
  /** History rows the table renders, after deduplication against live runs and client-side filters. */
  visibleHistoryCount: number;
}

/**
 * Footer for the unified pipeline run list. Pages deeper into the Tekton Results
 * archive below the live runs, following the conventional "load more" layout --
 * the action on top, a quiet status line beneath it.
 */
export function HistoryLoadingFooter({
  isHistoryLoading,
  historyQuery,
  visibleHistoryCount,
}: HistoryLoadingFooterProps) {
  const { isError, hasNextPage, refetch } = historyQuery;
  const { loadOlderRuns, isLoadingOlderRuns } = useLoadOlderRuns({ historyQuery, visibleHistoryCount });

  if (isHistoryLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-3 text-sm" role="status">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading pipeline run history…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-3" role="alert">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RotateCw className="h-4 w-4" />
          Retry
        </Button>
        <p className="text-destructive text-sm">Couldn't load older runs. Showing live data only.</p>
      </div>
    );
  }

  if (hasNextPage) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-3">
        <Button variant="outline" size="sm" onClick={loadOlderRuns} disabled={isLoadingOlderRuns}>
          {isLoadingOlderRuns ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
          {isLoadingOlderRuns ? "Loading…" : "Load older runs"}
        </Button>
        {visibleHistoryCount > 0 && (
          <p className="text-muted-foreground text-xs">Showing {visibleHistoryCount} from history</p>
        )}
      </div>
    );
  }

  if (visibleHistoryCount > 0) {
    return (
      <p className="text-muted-foreground py-3 text-center text-xs">
        End of history · showing {visibleHistoryCount} from history
      </p>
    );
  }

  return null;
}
