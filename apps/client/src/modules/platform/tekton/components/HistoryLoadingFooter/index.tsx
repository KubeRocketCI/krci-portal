import { Button } from "@/core/components/ui/button";
import { ChevronDown, Loader2, RotateCw } from "lucide-react";
import type { UseUnifiedPipelineRunListResult } from "../../hooks/useUnifiedPipelineRunList";

interface HistoryLoadingFooterProps {
  isHistoryLoading: boolean;
  historyQuery: UseUnifiedPipelineRunListResult["historyQuery"];
}

/**
 * Footer for the unified pipeline run list. Pages deeper into the Tekton Results
 * archive below the live runs, following the conventional "load more" layout --
 * the action on top, a quiet status line beneath it.
 */
export function HistoryLoadingFooter({ isHistoryLoading, historyQuery }: HistoryLoadingFooterProps) {
  const { data, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = historyQuery;

  // Derived here so callers don't have to thread a count prop; the reduce is over a
  // handful of pages, so a plain const is cheaper than memoizing it.
  const historyCount = data?.pages.reduce((total, page) => total + page.results.length, 0) ?? 0;

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
        <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
          {isFetchingNextPage ? "Loading…" : "Load older runs"}
        </Button>
        {historyCount > 0 && <p className="text-muted-foreground text-xs">Showing {historyCount} from history</p>}
      </div>
    );
  }

  // Reached the end of the archive -- text-only closure (only when history exists).
  if (historyCount > 0) {
    return (
      <p className="text-muted-foreground py-3 text-center text-xs">End of history · {historyCount} archived runs</p>
    );
  }

  return null;
}
