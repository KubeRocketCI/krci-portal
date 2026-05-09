import React from "react";
import { DataTable } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { TABLE } from "@/k8s/constants/tables";
import {
  useClusterInterceptorWatchList,
  useClusterInterceptorPermissions,
} from "@/k8s/api/groups/Tekton/ClusterInterceptor";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { useColumns } from "./hooks/useColumns";
import { ClusterInterceptorFilter } from "../ClusterInterceptorFilter";
import { useClusterInterceptorFilter } from "../ClusterInterceptorFilter/hooks/useFilter";

export const ClusterInterceptorList = () => {
  const columns = useColumns();
  // permissions.isFetched is used as a loading-state synchronizer to align
  // with the rest of the resource lists (e.g. PipelineList). The data is not
  // consumed yet — reserved for future row actions / create button gating.
  const permissions = useClusterInterceptorPermissions();
  const watch = useClusterInterceptorWatchList();
  const { filterFunction } = useClusterInterceptorFilter();

  const renderEmptyList = React.useMemo(() => {
    if (!permissions.isFetched || !watch.query.isFetched) return null;
    const forbiddenError = watch.query.error && getForbiddenError(watch.query.error);
    if (forbiddenError) return <ErrorContent error={forbiddenError} outlined />;
    return <EmptyList missingItemName="Cluster Interceptors" description="No Tekton ClusterInterceptors found." />;
  }, [permissions.isFetched, watch.query.isFetched, watch.query.error]);

  const tableSlots = React.useMemo(() => ({ header: { component: <ClusterInterceptorFilter /> } }), []);

  return (
    <DataTable
      id={TABLE.CLUSTER_INTERCEPTOR_LIST.id}
      name={TABLE.CLUSTER_INTERCEPTOR_LIST.name}
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
