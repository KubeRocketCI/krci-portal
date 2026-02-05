import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { useCDPipelinePermissions, useCDPipelineWatchList } from "@/k8s/api/groups/KRCI/CDPipeline";
import { TABLE } from "@/k8s/constants/tables";
import React from "react";
import { CDPipelineFilter } from "../CDPipelineFilter";
import { useCDPipelineFilter } from "../CDPipelineFilter/hooks/useCDPipelineFilter";
import { useColumns } from "./hooks/useColumns";
import { CDPipelineListProps } from "./types";
import { routeCDPipelineCreate } from "../../../create/route";
import { routeCDPipelineList } from "../../route";

export const CDPipelineList = ({ blockerComponent }: CDPipelineListProps) => {
  const columns = useColumns();
  const { clusterName } = routeCDPipelineList.useParams();

  const cdPipelinePermissions = useCDPipelinePermissions();
  const cdPipelineListWatch = useCDPipelineWatchList();

  const { filterFunction } = useCDPipelineFilter();

  const renderEmptyList = React.useMemo(() => {
    if (!cdPipelinePermissions.isFetched) return null;

    if (cdPipelinePermissions.data.create.allowed) {
      return (
        <EmptyList
          missingItemName={"Deployments"}
          linkText={"Click here to create a new Deployment"}
          route={{
            to: routeCDPipelineCreate.fullPath,
            params: { clusterName },
          }}
          description={"Take the first step towards managing your Deployment by adding a new environment here."}
        />
      );
    } else {
      return <EmptyList customText={cdPipelinePermissions.data.create.reason} />;
    }
  }, [
    cdPipelinePermissions.isFetched,
    cdPipelinePermissions.data.create.allowed,
    cdPipelinePermissions.data.create.reason,
    clusterName,
  ]);

  const tableSlots = React.useMemo(
    () => ({
      header: <CDPipelineFilter />,
    }),
    []
  );

  return (
    <DataTable
      id={TABLE.CDPIPELINE_LIST.id}
      name={TABLE.CDPIPELINE_LIST.name}
      isLoading={!cdPipelineListWatch.query.isFetched || !cdPipelinePermissions.isFetched}
      data={cdPipelineListWatch.data.array}
      errors={[]}
      columns={columns}
      filterFunction={filterFunction}
      blockerComponent={blockerComponent}
      emptyListComponent={renderEmptyList}
      slots={tableSlots}
    />
  );
};
