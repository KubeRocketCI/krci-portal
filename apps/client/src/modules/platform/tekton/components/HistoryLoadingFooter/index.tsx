import { Button } from "@/core/components/ui/button";
import { Loader2 } from "lucide-react";
import type { UseUnifiedPipelineRunListResult } from "../../hooks/useUnifiedPipelineRunList";

interface HistoryLoadingFooterProps {
  isHistoryLoading: boolean;
  historyQuery: UseUnifiedPipelineRunListResult["historyQuery"];
}

/**
 * Shared footer for the unified pipeline run list.
 * Shows a loading indicator while history is being fetched,
 * an error banner if history fetch fails, and a "Load more" button
 * for paginating through Tekton Results history.
 */
export function HistoryLoadingFooter({ isHistoryLoading, historyQuery }: HistoryLoadingFooterProps) {
  return (
    <>
      {isHistoryLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-3 text-sm" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pipeline run history...
        </div>
      )}
      {historyQuery.isError && (
        <div className="text-destructive flex items-center justify-center gap-2 py-3 text-sm">
          Failed to load pipeline run history. Showing live data only.
        </div>
      )}
      {historyQuery.hasNextPage && (
        <div className="flex justify-center py-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => historyQuery.fetchNextPage()}
            disabled={historyQuery.isFetchingNextPage}
          >
            {historyQuery.isFetchingNextPage ? "Loading more..." : "Load more history"}
          </Button>
        </div>
      )}
    </>
  );
}
