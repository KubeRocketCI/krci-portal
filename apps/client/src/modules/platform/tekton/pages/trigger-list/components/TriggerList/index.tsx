import React from "react";
import { DataTable } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { TABLE } from "@/k8s/constants/tables";
import { useTriggerWatchList, useTriggerPermissions } from "@/k8s/api/groups/Tekton/Trigger";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { useColumns } from "./hooks/useColumns";
import { TriggerFilter } from "../TriggerFilter";
import { useTriggerFilter } from "../TriggerFilter/hooks/useFilter";

export const TriggerList = () => {
  const columns = useColumns();
  // permissions.isFetched is used as a loading-state synchronizer to align
  // with the rest of the resource lists (e.g. PipelineList). The data is not
  // consumed yet — reserved for future row actions / create button gating.
  const permissions = useTriggerPermissions();
  const watch = useTriggerWatchList();
  const { filterFunction } = useTriggerFilter();

  const renderEmptyList = React.useMemo(() => {
    if (!permissions.isFetched || !watch.query.isFetched) return null;
    const forbiddenError = watch.query.error && getForbiddenError(watch.query.error);
    if (forbiddenError) return <ErrorContent error={forbiddenError} outlined />;
    return <EmptyList missingItemName="Triggers" description="No Tekton Triggers found in the current namespace." />;
  }, [permissions.isFetched, watch.query.isFetched, watch.query.error]);

  const tableSlots = React.useMemo(() => ({ header: { component: <TriggerFilter /> } }), []);

  return (
    <DataTable
      id={TABLE.TRIGGER_LIST.id}
      name={TABLE.TRIGGER_LIST.name}
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
