import React from "react";
import { DataTable } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { TABLE } from "@/k8s/constants/tables";
import { useTriggerBindingWatchList, useTriggerBindingPermissions } from "@/k8s/api/groups/Tekton/TriggerBinding";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { useColumns } from "./hooks/useColumns";
import { TriggerBindingFilter } from "../TriggerBindingFilter";
import { useTriggerBindingFilter } from "../TriggerBindingFilter/hooks/useFilter";

export const TriggerBindingList = () => {
  const columns = useColumns();
  // permissions.isFetched is used as a loading-state synchronizer to align
  // with the rest of the resource lists (e.g. PipelineList). The data is not
  // consumed yet — reserved for future row actions / create button gating.
  const permissions = useTriggerBindingPermissions();
  const watch = useTriggerBindingWatchList();
  const { filterFunction } = useTriggerBindingFilter();

  const renderEmptyList = React.useMemo(() => {
    if (!permissions.isFetched || !watch.query.isFetched) return null;
    const forbiddenError = watch.query.error && getForbiddenError(watch.query.error);
    if (forbiddenError) return <ErrorContent error={forbiddenError} outlined />;
    return (
      <EmptyList
        missingItemName="Trigger Bindings"
        description="No Tekton TriggerBindings found in the current namespace."
      />
    );
  }, [permissions.isFetched, watch.query.isFetched, watch.query.error]);

  const tableSlots = React.useMemo(() => ({ header: { component: <TriggerBindingFilter /> } }), []);

  return (
    <DataTable
      id={TABLE.TRIGGER_BINDING_LIST.id}
      name={TABLE.TRIGGER_BINDING_LIST.name}
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
