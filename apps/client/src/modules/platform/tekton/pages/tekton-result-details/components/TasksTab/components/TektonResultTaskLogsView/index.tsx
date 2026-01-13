import { TektonResultsLogViewer } from "../../../TektonResultsLogViewer";
import { useTektonResultTaskRunLogsQuery } from "../../../../hooks/data";

interface TektonResultTaskLogsViewProps {
  taskRunName: string;
}

function getQueryErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export const TektonResultTaskLogsView = ({ taskRunName }: TektonResultTaskLogsViewProps) => {
  const logsQuery = useTektonResultTaskRunLogsQuery(taskRunName);

  const hasLogs = !!logsQuery.data?.logs;
  const showLoading = logsQuery.isFetching && !hasLogs;
  const taskName = logsQuery.data?.taskName || taskRunName;
  const errorMessage = logsQuery.data?.error || undefined;
  const queryError = logsQuery.isError ? getQueryErrorMessage(logsQuery.error) : undefined;

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
          error={queryError}
          downloadFilename={`${taskRunName}-log.txt`}
        />
      </div>
    </div>
  );
};
