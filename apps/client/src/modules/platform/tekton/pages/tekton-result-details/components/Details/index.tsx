import { TektonResultsLogViewer } from "../TektonResultsLogViewer";
import { useTektonResultPipelineRunLogsQuery, useTektonResultPipelineRunQuery } from "../../hooks/data";
import { routeTektonResultPipelineRunDetails, routeSearchTabName, routeSearchLogViewName } from "../../route";

function getQueryErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export const Details = () => {
  const queryParams = routeTektonResultPipelineRunDetails.useSearch();
  const isAllLogsActive =
    queryParams.tab === routeSearchTabName.logs && queryParams.logView === routeSearchLogViewName.all;

  const pipelineRunQuery = useTektonResultPipelineRunQuery();
  const logsQuery = useTektonResultPipelineRunLogsQuery(isAllLogsActive);

  const pipelineRunName = pipelineRunQuery.data?.pipelineRun?.metadata?.name || "pipelinerun";
  const hasLogs = !!logsQuery.data?.logs;
  const showLoading = logsQuery.isFetching && !hasLogs;
  const queryError = logsQuery.isError ? getQueryErrorMessage(logsQuery.error) : undefined;

  return (
    <TektonResultsLogViewer
      content={logsQuery.data?.logs || ""}
      isLoading={showLoading}
      error={queryError}
      downloadFilename={`${pipelineRunName}-log.txt`}
    />
  );
};
