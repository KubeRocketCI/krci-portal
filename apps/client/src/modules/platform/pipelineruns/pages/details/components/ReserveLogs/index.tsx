import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Stack, Typography } from "@mui/material";
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
    <Stack spacing={1}>
      <LoadingWrapper isLoading={pipelineRunLogsQuery.isLoading}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <TriangleAlert size={48} />
          <Stack spacing={1} direction="row" alignItems="center">
            <Typography component="span" fontSize={(t) => t.typography.pxToRem(14)} color="#596D80">
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
            </Typography>
          </Stack>
        </Stack>
        {hasReserveLogs && <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />}
      </LoadingWrapper>
    </Stack>
  );
};
