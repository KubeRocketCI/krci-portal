import { Alert } from "@/core/components/ui/alert";
import type { Pod } from "@my-project/shared";
import { PodSummaryGrid } from "../components/PodSummaryGrid";
import { PodContainersCard } from "../components/PodContainersCard";
import { PodInformationCard } from "../components/PodInformationCard";
import { PodOverviewSidebar } from "../components/PodOverviewSidebar";

export function OverviewTab({ pod }: { pod: Pod }) {
  const errorMessage = pod.status?.message;
  const errorReason = pod.status?.reason;
  const showError = pod.status?.phase === "Failed" || (errorReason && errorReason !== "Completed");

  return (
    <div className="flex flex-col gap-4 p-4">
      <PodSummaryGrid pod={pod} />

      {showError && (errorMessage || errorReason) && (
        <Alert variant="destructive" title={errorReason ?? "Pod error"}>
          {errorMessage ?? null}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <PodContainersCard pod={pod} />
          <PodInformationCard pod={pod} />
        </div>
        <div className="lg:col-span-1">
          <PodOverviewSidebar pod={pod} />
        </div>
      </div>
    </div>
  );
}
