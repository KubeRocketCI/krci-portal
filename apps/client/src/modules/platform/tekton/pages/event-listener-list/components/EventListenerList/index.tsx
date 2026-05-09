import React from "react";
import { DataTable } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { TABLE } from "@/k8s/constants/tables";
import { useEventListenerWatchList, useEventListenerPermissions } from "@/k8s/api/groups/Tekton/EventListener";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { useColumns } from "./hooks/useColumns";
import { EventListenerFilter } from "../EventListenerFilter";
import { useEventListenerFilter } from "../EventListenerFilter/hooks/useFilter";

export const EventListenerList = () => {
  const columns = useColumns();
  // permissions.isFetched is used as a loading-state synchronizer to align
  // with the rest of the resource lists (e.g. PipelineList). The data is not
  // consumed yet — reserved for future row actions / create button gating.
  const permissions = useEventListenerPermissions();
  const watch = useEventListenerWatchList();
  const { filterFunction } = useEventListenerFilter();

  const renderEmptyList = React.useMemo(() => {
    if (!permissions.isFetched || !watch.query.isFetched) return null;
    const forbiddenError = watch.query.error && getForbiddenError(watch.query.error);
    if (forbiddenError) return <ErrorContent error={forbiddenError} outlined />;
    return (
      <EmptyList
        missingItemName="Event Listeners"
        description="No Tekton EventListeners found in the current namespace."
      />
    );
  }, [permissions.isFetched, watch.query.isFetched, watch.query.error]);

  const tableSlots = React.useMemo(() => ({ header: { component: <EventListenerFilter /> } }), []);

  return (
    <DataTable
      id={TABLE.EVENT_LISTENER_LIST.id}
      name={TABLE.EVENT_LISTENER_LIST.name}
      isLoading={!watch.query.isFetched || !permissions.isFetched}
      data={watch.data.array}
      errors={[]}
      columns={columns}
      emptyListComponent={renderEmptyList}
      filterFunction={filterFunction}
      slots={tableSlots}
    />
  );
};
