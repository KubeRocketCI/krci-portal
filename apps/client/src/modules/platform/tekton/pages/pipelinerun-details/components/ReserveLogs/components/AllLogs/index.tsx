import { Terminal } from "@/core/components/Terminal";
import { routePipelineRunDetails } from "../../../../route";
import { usePipelineRunLogsQueryWithPageParams } from "../../../../hooks/data";

export const AllLogs = () => {
  const params = routePipelineRunDetails.useParams();

  const logsQuery = usePipelineRunLogsQueryWithPageParams();
  const logsContent = logsQuery.data?.all.join("");

  return (
    <Terminal
      content={logsContent}
      height={600}
      enableSearch={true}
      enableDownload={true}
      enableCopy={true}
      showToolbar={true}
      readonly={true}
      downloadFilename={`pipeline-run-logs-${params.name}.log`}
    />
  );
};
