import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { LoadFailedState, UnreachableState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { failureOf, groupFailures, type Part } from "../../utils/parts";
import { Note } from "../Note";

/** An alert with a Retry per failed part, shown once above its places; parts that failed alike share one. */
export function PartAlerts({ parts }: { parts: Part[] }) {
  return groupFailures(parts).map(({ failure, failed }) => {
    const retry = () => failed.forEach((part) => void part.query?.refetch());
    const isRetrying = failed.some((part) => part.query?.isFetching);
    if (failure.kind === "failed") {
      return (
        <LoadFailedState key={failure.message} message={failure.message} onRetry={retry} isRetrying={isRetrying} />
      );
    }
    const wholePage = failed.length > 1;
    return (
      <UnreachableState
        key="unreachable"
        what={wholePage ? "Security findings" : failed[0].what}
        wholePage={wholePage}
        onRetry={retry}
        isRetrying={isRetrying}
      />
    );
  });
}

/** What a place of the part shows in place of its data; see `showsPlaceholder`. */
export function PartPlaceholder({ part }: { part: Part }) {
  if (part.query === null) {
    return <Note>{part.unaskedNote}</Note>;
  }
  if (part.query.isPending) {
    return (
      <div className="flex justify-center p-6">
        <LoadingSpinner size={24} />
      </div>
    );
  }
  if (failureOf(part)) {
    return <Note>{part.what} cannot be loaded.</Note>;
  }
  return part.noScanData;
}
