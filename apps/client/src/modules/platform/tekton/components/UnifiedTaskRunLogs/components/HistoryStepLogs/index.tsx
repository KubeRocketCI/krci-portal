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
}

/**
 * Fetches and displays step-level logs from Tekton Results.
 * Uses the getTaskRunLogs procedure with the stepName param to filter
 * log lines by [stepName] prefix.
 *
 * Includes graceful degradation: when step-level filtering finds no
 * [stepName] prefixes, shows full TaskRun log with an info banner.
 */
export function HistoryStepLogs({ taskRunName, stepName, resultUid, namespace }: HistoryStepLogsProps) {
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

  const showFallbackBanner = logsQuery.data.stepFiltered === false;

  return (
    <div className="flex h-full flex-col gap-2">
      {showFallbackBanner && (
        <Alert
          title="Showing full TaskRun log"
          className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
        >
          Step-level log parsing is not available for this TaskRun. The logs below contain output from all steps.
        </Alert>
      )}
      <LogViewer content={logsQuery.data.logs} />
    </div>
  );
}
