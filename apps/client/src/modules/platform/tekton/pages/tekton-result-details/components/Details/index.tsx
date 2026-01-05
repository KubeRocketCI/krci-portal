import { TektonResultsLogViewer } from "../TektonResultsLogViewer";
import { useTektonResultPipelineRunLogsQuery, useTektonResultPipelineRunQuery } from "../../hooks/data";

export const Details = () => {
  const pipelineRunQuery = useTektonResultPipelineRunQuery();
  const logsQuery = useTektonResultPipelineRunLogsQuery();

  const pipelineRunName = pipelineRunQuery.data?.pipelineRun?.metadata?.name || "pipelinerun";
  const hasLogs = !!logsQuery.data?.logs;
  const showLoading = logsQuery.isFetching && !hasLogs;

  return (
    <TektonResultsLogViewer
      content={logsQuery.data?.logs || ""}
      isLoading={showLoading}
      error={logsQuery.isError ? (logsQuery.error instanceof Error ? logsQuery.error.message : "Unknown error") : undefined}
      downloadFilename={`${pipelineRunName}-log.txt`}
    />
  );
};
