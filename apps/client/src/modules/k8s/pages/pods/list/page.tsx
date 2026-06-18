import { useMemo } from "react";
import { Box } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import { EmptyList } from "@/core/components/EmptyList";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { DataTable } from "@/core/components/Table";
import { FilterProvider } from "@/core/providers/Filter";
import { useK8sResourceListMulti } from "../../../hooks/useK8sResourceListMulti";
import { useK8sWatchStatus } from "../../../hooks/useK8sWatchStatus";
import { resolveListNamespaces } from "../../../utils/resolveListNamespaces";
import { WatchConnectionIndicator } from "../../../components/WatchConnectionIndicator";
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
  const columns = useColumns();
  const { form, filterFunction } = usePodFilter();

  const filterNamespaces = form.state.values.namespaces;
  const namespaces = useMemo(
    () => resolveListNamespaces({ urlNamespace: search.namespace, filterNamespaces }),
    [search.namespace, filterNamespaces]
  );
  const result = useK8sResourceListMulti<Pod>(k8sPodConfig, { namespaces });
  const items = result.data.array as Pod[];
  const { errors, watchStatus } = useK8sWatchStatus(result.errors);

  const tableSlots = useMemo(
    () => ({
      header: {
        component: <PodFilter />,
      },
    }),
    []
  );

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
          errors={errors}
          filterFunction={filterFunction}
          slots={tableSlots}
          emptyListComponent={
            <EmptyList
              icon={<Box width={64} height={64} className="text-muted-foreground" />}
              customText="No Pods found"
              description={
                search.namespace ? `There are no Pods in namespace ${search.namespace}` : "There are no Pods"
              }
            />
          }
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
