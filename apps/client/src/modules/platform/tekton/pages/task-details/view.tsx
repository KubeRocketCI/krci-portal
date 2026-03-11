import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Bot, EllipsisVertical } from "lucide-react";
import React from "react";
import { TaskActionsMenu } from "../../components/TaskActionsMenu";
import { PATH_TASKS_FULL } from "../task-list/route";
import { useTaskWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routeTaskDetails } from "./route";

export default function TaskDetailsPageContent({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routeTaskDetails.useParams();
  const taskWatch = useTaskWatch();
  const task = taskWatch.query.data;

  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();

  const [menuOpen, setMenuOpen] = React.useState(false);

  const showTabs = !taskWatch.query.error && !taskWatch.query.isLoading;

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
    >
      <PageContentWrapper
        icon={Bot}
        title={params.name}
        enableCopyTitle
        description="Browse and visualize your Tekton tasks. View task definitions and their task dependencies."
        actions={
          taskWatch.isReady &&
          task && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="More options">
                  Actions
                  <EllipsisVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <TaskActionsMenu
                data={{
                  task: task,
                }}
                variant="menu"
              />
            </DropdownMenu>
          )
        }
        tabs={showTabs ? tabs : undefined}
        activeTab={searchTabIdx}
        onTabChange={handleChangeTab}
      >
        {taskWatch.query.error && <ErrorContent error={taskWatch.query.error} />}
        {taskWatch.query.isLoading && <LoadingWrapper isLoading>{null}</LoadingWrapper>}
      </PageContentWrapper>
    </PageWrapper>
  );
}
