import { TektonResultsLogViewer } from "../../../TektonResultsLogViewer";
import { useTektonResultTaskRunLogsQuery } from "../../../../hooks/data";

interface TektonResultTaskLogsViewProps {
  taskRunName: string;
}

export const TektonResultTaskLogsView = ({ taskRunName }: TektonResultTaskLogsViewProps) => {
  const logsQuery = useTektonResultTaskRunLogsQuery(taskRunName);

  const hasLogs = !!logsQuery.data?.logs;
  const showLoading = logsQuery.isFetching && !hasLogs;

  // Extract task name from logs data or display taskRunName as fallback
  const taskName = logsQuery.data?.taskName || taskRunName;

  // Error is always present on response type (null when no error)
  const errorMessage = logsQuery.data?.error || undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="text-foreground font-medium">Task: {taskName}</h3>
        {errorMessage && <p className="text-destructive mt-1 text-xs">{errorMessage}</p>}
      </div>
      <div className="flex-1">
        <TektonResultsLogViewer
          content={logsQuery.data?.logs || ""}
          isLoading={showLoading}
          error={
            logsQuery.isError
              ? logsQuery.error instanceof Error
                ? logsQuery.error.message
                : "Unknown error"
              : undefined
          }
          downloadFilename={`${taskRunName}-log.txt`}
        />
      </div>
    </div>
  );
};
