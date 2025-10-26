import React from "react";
import { Table } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "./hooks/useColumns";
import { useTaskPermissions } from "@/k8s/api/groups/Tekton/Task";
import { useTaskWatchList } from "@/k8s/api/groups/Tekton/Task";
import { TaskFilter } from "../TaskFilter";
import { useTaskFilter } from "../TaskFilter/hooks/useFilter";

export const TaskList = () => {
  const columns = useColumns();

  const taskPermissions = useTaskPermissions();
  const taskListWatch = useTaskWatchList();

  const { filterFunction } = useTaskFilter();

  const renderEmptyList = React.useMemo(() => {
    if (!taskPermissions.isFetched) return null;

    return <EmptyList missingItemName={"Tasks"} description={"No Tekton tasks found in the current namespace."} />;
  }, [taskPermissions.isFetched]);

  const tableSlots = React.useMemo(
    () => ({
      header: <TaskFilter />,
    }),
    []
  );

  return (
    <Table
      id={TABLE.TASK_LIST?.id || "task-list"}
      name={TABLE.TASK_LIST?.name || "Tasks"}
      isLoading={!taskListWatch.query.isFetched || !taskPermissions.isFetched}
      data={taskListWatch.data.array}
      errors={[]}
      columns={columns}
      emptyListComponent={renderEmptyList}
      filterFunction={filterFunction}
      slots={tableSlots}
    />
  );
};
