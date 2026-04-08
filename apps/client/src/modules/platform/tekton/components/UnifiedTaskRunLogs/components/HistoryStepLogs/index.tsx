import { LogViewer } from "@/core/components/LogViewer";
import { EmptyList } from "@/core/components/EmptyList";
import { Alert } from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useTRPCClient } from "@/core/providers/trpc";
import { downloadTextFile, generateTimestampedLogFilename, sanitizeLogFilenamePart } from "@/core/utils/download";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download } from "lucide-react";
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
    staleTime: Infinity,
  });

  const logs = logsQuery.data?.logs;

  const handleCopy = async () => {
    if (logs) {
      await navigator.clipboard.writeText(logs);
    }
  };

  const handleDownload = () => {
    if (logs) {
      const prefix = `${sanitizeLogFilenamePart(taskRunName)}-${sanitizeLogFilenamePart(stepName)}`;
      downloadTextFile(logs, generateTimestampedLogFilename(prefix));
    }
  };

  const renderControls = () => (
    <div className="flex w-full justify-end">
      <div className="flex gap-1">
        <Tooltip title="Copy to clipboard">
          <Button variant="secondary" size="icon" onClick={handleCopy} disabled={!logs} className="h-8 w-8">
            <Copy className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip title="Download logs">
          <Button variant="secondary" size="icon" onClick={handleDownload} disabled={!logs} className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );

  if (logsQuery.isLoading) {
    return <LogViewer content="" isLoading loadingMessage="Loading step logs..." />;
  }

  if (logsQuery.data?.error) {
    return <LogViewer content="" error={logsQuery.data.error} />;
  }

  if (!logsQuery.data?.hasLogs) {
    return (
      <Card className="h-full overflow-hidden">
        <EmptyList
          customText="No logs available for this step"
          description="Logs may not have been stored for this step."
        />
      </Card>
    );
  }

  if (logsQuery.data.stepFiltered === false) {
    return (
      <div className="flex h-full flex-col gap-2">
        <Alert
          title="Showing full TaskRun log"
          className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
        >
          Step-level log parsing is not available for this TaskRun. The logs below contain output from all steps.
        </Alert>
        <LogViewer content={logs} renderControls={renderControls} />
      </div>
    );
  }

  return <LogViewer content={logs} renderControls={renderControls} />;
}
