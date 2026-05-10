import { useMemo } from "react";
import { Box } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import { EmptyList } from "@/core/components/EmptyList";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { DataTable } from "@/core/components/Table";
import { FilterProvider } from "@/core/providers/Filter";
import { useK8sResourceList } from "../../../hooks/useK8sResourceList";
import { WatchConnectionIndicator, type WatchStatus } from "../../../components/WatchConnectionIndicator";
import { useClusterStore } from "@/k8s/store";
import { k8sPodConfig } from "@my-project/shared";
import type { Pod } from "@my-project/shared";
import { TABLE_ID_K8S_PODS } from "@/k8s/constants/tables";
import { PodFilter } from "./components/PodFilter";
import { defaultPodFilterValues, matchFunctions } from "./components/PodFilter/constants";
import { usePodFilter } from "./components/PodFilter/hooks/usePodFilter";
import { useColumns } from "./hooks/useColumns";

export default function K8sPodsListPage() {
  return (
    <FilterProvider matchFunctions={matchFunctions} syncWithUrl defaultValues={defaultPodFilterValues}>
      <K8sPodsListContent />
    </FilterProvider>
  );
}

function K8sPodsListContent() {
  const search = useSearch({ strict: false }) as { namespace?: string };
  const stored = useClusterStore((s) => s.defaultNamespace);
  const columns = useColumns();
  const { filterFunction } = usePodFilter();

  const namespace = search.namespace ?? stored ?? "";
  const result = useK8sResourceList<Pod>(k8sPodConfig, namespace);
  const items = useMemo(() => result.data.array as Pod[], [result.data.array]);

  const tableSlots = useMemo(
    () => ({
      header: {
        component: <PodFilter />,
      },
    }),
    []
  );

  const watchStatus: WatchStatus = result.error ? "error" : "connected";

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Cluster" }, { label: "Pods" }]}
      headerSlot={<WatchConnectionIndicator status={watchStatus} />}
    >
      <PageContentWrapper icon={Box} title="Pods">
        <DataTable<Pod>
          id={TABLE_ID_K8S_PODS}
          data={items}
          columns={columns}
          isLoading={result.isLoading}
          blockerError={(result.error as Error) ?? null}
          filterFunction={filterFunction}
          slots={tableSlots}
          outlined={false}
          emptyListComponent={
            <EmptyList
              icon={<Box width={64} height={64} className="text-muted-foreground" />}
              customText="No Pods found"
              description={namespace ? `There are no Pods in namespace ${namespace}` : "There are no Pods"}
            />
          }
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
