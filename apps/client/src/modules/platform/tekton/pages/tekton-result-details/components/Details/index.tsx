import { TektonResultsLogViewer } from "../TektonResultsLogViewer";
import { useTektonResultPipelineRunLogsQuery, useTektonResultPipelineRunQuery } from "../../hooks/data";
import { routeTektonResultPipelineRunDetails, routeSearchTabName, routeSearchLogViewName } from "../../route";

export const Details = () => {
  const queryParams = routeTektonResultPipelineRunDetails.useSearch();
  const isAllLogsActive =
    queryParams.tab === routeSearchTabName.logs && queryParams.logView === routeSearchLogViewName.all;

  const pipelineRunQuery = useTektonResultPipelineRunQuery();
  const logsQuery = useTektonResultPipelineRunLogsQuery(isAllLogsActive);

  const pipelineRunName = pipelineRunQuery.data?.pipelineRun?.metadata?.name || "pipelinerun";
  const hasLogs = !!logsQuery.data?.logs;
  const showLoading = logsQuery.isFetching && !hasLogs;

  return (
    <TektonResultsLogViewer
      content={logsQuery.data?.logs || ""}
      isLoading={showLoading}
      error={
        logsQuery.isError ? (logsQuery.error instanceof Error ? logsQuery.error.message : "Unknown error") : undefined
      }
      downloadFilename={`${pipelineRunName}-log.txt`}
    />
  );
};
