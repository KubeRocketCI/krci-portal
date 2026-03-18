import { LogViewer } from "@/core/components/LogViewer";
import { EmptyList } from "@/core/components/EmptyList";
import { Alert } from "@/core/components/ui/alert";
import { Card } from "@/core/components/ui/card";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

interface HistoryStepLogsProps {
  taskRunName: string;
  stepName: string;
  resultUid: string;
  namespace: string;
  isArchived?: boolean;
}

/**
 * Returns banner config based on data source context and step filter outcome.
 *
 * Handles the full matrix:
 * - archived + filtered    → amber: "archived logs"
 * - archived + unfiltered  → amber: "archived + full TaskRun log"
 * - history  + unfiltered  → blue:  "full TaskRun log"
 * - otherwise              → no banner
 */
const AMBER_BANNER_CLASS =
  "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200";

function getLogBanner(isArchived: boolean, stepFiltered: boolean | undefined) {
  if (isArchived && stepFiltered === false) {
    return {
      title: "Showing archived logs",
      className: AMBER_BANNER_CLASS,
      message:
        "Pods are no longer available. Showing full TaskRun log from Tekton Results because step-level parsing is not available.",
    };
  }
  if (isArchived) {
    return {
      title: "Showing archived logs",
      className: AMBER_BANNER_CLASS,
      message: "Pods are no longer available. Showing logs from Tekton Results.",
    };
  }
  if (stepFiltered === false) {
    return {
      title: "Showing full TaskRun log",
      className: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
      message:
        "Step-level log parsing is not available for this TaskRun. The logs below contain output from all steps.",
    };
  }
  return null;
}

/**
 * Fetches and displays step-level logs from Tekton Results.
 * Uses the getTaskRunLogs procedure with the stepName param to filter
 * log lines by [stepName] prefix.
 *
 * Owns all banner rendering: both data-source context (archived vs history)
 * and data-quality context (step-filtered vs full TaskRun log).
 */
export function HistoryStepLogs({
  taskRunName,
  stepName,
  resultUid,
  namespace,
  isArchived = false,
}: HistoryStepLogsProps) {
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  const logsQuery = useQuery({
    queryKey: ["tektonResults", "unifiedStepLogs", clusterName, namespace, resultUid, taskRunName, stepName],
    queryFn: () =>
      trpc.tektonResults.getTaskRunLogs.query({
        namespace,
        resultUid,
        taskRunName,
        stepName,
      }),
    enabled: !!taskRunName && !!resultUid,
  });

  if (logsQuery.isLoading) {
    return <LogViewer content="" isLoading loadingMessage="Loading step logs from Tekton Results..." />;
  }

  if (logsQuery.data?.error) {
    return <LogViewer content="" error={logsQuery.data.error} />;
  }

  if (!logsQuery.data?.hasLogs) {
    return (
      <Card className="h-full overflow-hidden">
        <EmptyList
          customText="No logs available for this step"
          description="Logs may not have been stored in Tekton Results for this step."
        />
      </Card>
    );
  }

  const banner = getLogBanner(isArchived, logsQuery.data.stepFiltered);

  return (
    <div className="flex h-full flex-col gap-2">
      {banner && (
        <Alert title={banner.title} className={banner.className}>
          {banner.message}
        </Alert>
      )}
      <LogViewer content={logsQuery.data.logs} />
    </div>
  );
}
