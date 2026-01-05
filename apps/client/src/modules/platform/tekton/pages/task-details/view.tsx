import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { TriangleAlert } from "lucide-react";
import React from "react";
import { TaskActionsMenu } from "../../components/TaskActionsMenu";
import { PATH_TASKS_FULL } from "../task-list/route";
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
        <div className="flex flex-col gap-1">
          <LoadingWrapper isLoading={false}>
            <div className="flex items-center justify-center gap-1">
              <TriangleAlert size={48} />
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm">
                  No task was found for the requested resource. Please ensure you have checked the correct resource.
                </span>
              </div>
            </div>
          </LoadingWrapper>
        </div>
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
      <div className="flex items-center gap-2">
        <TaskActionsMenu
          data={{
            task: task!,
          }}
          variant="inline"
        />
      </div>
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
