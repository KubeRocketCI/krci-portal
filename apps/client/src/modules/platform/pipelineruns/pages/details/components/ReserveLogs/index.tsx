import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { TriangleAlert } from "lucide-react";
import { usePipelineRunLogsQueryWithPageParams } from "../../hooks/data";
import { useTabs } from "./hooks/useTabs";

export const ReserveLogs = () => {
  const pipelineRunLogsQuery = usePipelineRunLogsQueryWithPageParams();
  const pipelineRunLogs = pipelineRunLogsQuery.data;

  const hasReserveLogs = pipelineRunLogs?.all?.length && pipelineRunLogs.all.length > 0;

  const tabs = useTabs();
  const { handleChangeTab, activeTab } = useTabsContext();

  return (
    <div className="flex flex-col gap-2">
      <LoadingWrapper isLoading={pipelineRunLogsQuery.isLoading}>
        <div className="flex flex-row gap-2 items-center justify-center">
          <TriangleAlert size={48} />
          <div className="flex flex-row gap-2 items-center">
            <span className="text-sm text-muted-foreground">
              {hasReserveLogs ? (
                "No pipeline runs were found for the requested resource. Logs have been retrieved from OpenSearch."
              ) : (
                <>
                  <p>
                    No logs were found for the requested pipeline run. This might have been caused by environment
                    cleanup. Please ensure you have checked the correct resource.
                  </p>
                  {pipelineRunLogsQuery.error && pipelineRunLogsQuery.error?.message}
                </>
              )}
            </span>
          </div>
        </div>
        {hasReserveLogs && <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />}
      </LoadingWrapper>
    </div>
  );
};
