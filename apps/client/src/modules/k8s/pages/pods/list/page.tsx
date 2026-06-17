import { useMemo } from "react";
import { Box } from "lucide-react";
import { EmptyList } from "@/core/components/EmptyList";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { DataTable } from "@/core/components/Table";
import { FilterProvider } from "@/core/providers/Filter";
import { useWatchListMultiple } from "@/k8s/api/hooks/useWatch/useWatchListMultiple";
import { WatchConnectionIndicator, type WatchStatus } from "../../../components/WatchConnectionIndicator";
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
  const columns = useColumns();
  const { filterFunction } = usePodFilter();

  const result = useWatchListMultiple<Pod>({ resourceConfig: k8sPodConfig });
  const items = useMemo(() => result.data.array as Pod[], [result.data.array]);

  const tableSlots = useMemo(
    () => ({
      header: {
        component: <PodFilter />,
      },
    }),
    []
  );

  const watchStatus: WatchStatus = result.errors.length > 0 ? "error" : "connected";

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
          blockerError={(result.errors[0] as Error) ?? null}
          filterFunction={filterFunction}
          slots={tableSlots}
          emptyListComponent={
            <EmptyList
              icon={<Box width={64} height={64} className="text-muted-foreground" />}
              customText="No Pods found"
              description="There are no Pods"
            />
          }
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
