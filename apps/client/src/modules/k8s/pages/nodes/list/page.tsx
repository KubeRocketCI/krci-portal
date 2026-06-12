import { useMemo } from "react";
import { Box, Server } from "lucide-react";
import { EmptyList } from "@/core/components/EmptyList";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { DataTable } from "@/core/components/Table";
import { FilterProvider } from "@/core/providers/Filter";
import { useK8sResourceList } from "../../../hooks/useK8sResourceList";
import { WatchConnectionIndicator, type WatchStatus } from "../../../components/WatchConnectionIndicator";
import { k8sNodeConfig, type Node } from "@my-project/shared";
import { TABLE_ID_K8S_NODES } from "@/k8s/constants/tables";
import { NodeFilter } from "./components/NodeFilter";
import { defaultNodeFilterValues, matchFunctions } from "./components/NodeFilter/constants";
import { useNodeFilter } from "./components/NodeFilter/hooks/useNodeFilter";
import { useColumns } from "./hooks/useColumns";

export default function K8sNodesListPage() {
  return (
    <FilterProvider matchFunctions={matchFunctions} syncWithUrl defaultValues={defaultNodeFilterValues}>
      <K8sNodesListContent />
    </FilterProvider>
  );
}

function K8sNodesListContent() {
  const columns = useColumns();
  const { filterFunction } = useNodeFilter();
  const result = useK8sResourceList<Node>(k8sNodeConfig, "");
  const items = useMemo(() => (result.data?.array ?? []) as Node[], [result.data]);

  const tableSlots = useMemo(
    () => ({
      header: {
        component: <NodeFilter />,
      },
    }),
    []
  );

  const watchStatus: WatchStatus = result.error ? "error" : "connected";

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Cluster" }, { label: "Nodes" }]}
      headerSlot={<WatchConnectionIndicator status={watchStatus} />}
    >
      <PageContentWrapper icon={Server} title="Nodes">
        <DataTable<Node>
          id={TABLE_ID_K8S_NODES}
          data={items}
          columns={columns}
          isLoading={result.isLoading}
          blockerError={(result.error as Error) ?? null}
          filterFunction={filterFunction}
          slots={tableSlots}
          emptyListComponent={
            <EmptyList
              icon={<Box width={64} height={64} className="text-muted-foreground" />}
              customText="No Nodes found"
              description="There are no Nodes in the cluster"
            />
          }
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
