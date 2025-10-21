import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Stack, Typography } from "@mui/material";
import { TriangleAlert } from "lucide-react";
import React from "react";
import { TaskActionsMenu } from "../../components/TaskActionsMenu";
import { PATH_TASKS_FULL } from "../list/route";
import { useTaskWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routeTaskDetails } from "./route";

export default function TaskDetailsPageContent() {
  const params = routeTaskDetails.useParams();
  const taskWatch = useTaskWatch();
  const task = taskWatch.query.data;

  const tabs = useTabs();
  const { activeTab, handleChangeTab } = useTabsContext();

  const renderPageContent = React.useCallback(() => {
    if (taskWatch.query.error) {
      return (
        <Stack spacing={1}>
          <LoadingWrapper isLoading={false}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <TriangleAlert size={48} />
              <Stack spacing={1} direction="row" alignItems="center">
                <Typography component="span" fontSize={(t) => t.typography.pxToRem(14)} color="#596D80">
                  No task was found for the requested resource. Please ensure you have checked the correct resource.
                </Typography>
              </Stack>
            </Stack>
          </LoadingWrapper>
        </Stack>
      );
    }

    return (
      <LoadingWrapper isLoading={taskWatch.query.isLoading}>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [taskWatch.query.error, taskWatch.query.isLoading, tabs, activeTab, handleChangeTab]);

  const renderHeaderSlot = () => {
    if (!taskWatch.isReady || !task) {
      return <></>;
    }

    return (
      <Stack direction="row" spacing={2} alignItems="center">
        <TaskActionsMenu
          data={{
            task: task!,
          }}
          variant="inline"
        />
      </Stack>
    );
  };

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Tasks",
          route: {
            to: PATH_TASKS_FULL,
          },
        },
        {
          label: params.name,
        },
      ]}
      headerSlot={renderHeaderSlot()}
    >
      {renderPageContent()}
    </PageWrapper>
  );
}
