import { useMemo } from "react";
import { useParams, useSearch } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { FilterProvider } from "@/core/providers/Filter";
import { ResourceTable } from "../../components/ResourceTable";
import { WatchConnectionIndicator, type WatchStatus } from "../../components/WatchConnectionIndicator";
import { ListFilter } from "./components/ListFilter";
import { defaultK8sListFilterValues, matchFunctions } from "./components/ListFilter/constants";
import { useK8sListFilter } from "./components/ListFilter/hooks/useK8sListFilter";
import { useK8sResourceList } from "../../hooks/useK8sResourceList";
import { resolveDescriptor } from "../../registry/resolve";
import { resourceRegistry } from "../../registry";
import { useClusterStore } from "@/k8s/store";
import type { KubeObjectBase } from "@my-project/shared";
import type { ResourceDescriptor } from "../../registry/types";

// Stable fallback config used when descriptor is not found — keeps hook call unconditional.
const FALLBACK_CONFIG = {
  apiVersion: "v1",
  kind: "Unknown",
  group: "",
  version: "v1",
  singularName: "unknown",
  pluralName: "unknown",
} as const;

export default function K8sResourceListView() {
  const { kind } = useParams({ strict: false }) as { kind?: string };
  const descriptor = kind ? resolveDescriptor(resourceRegistry, kind) : null;

  if (!descriptor) {
    return (
      <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Unknown" }]}>
        <PageContentWrapper icon={Layers} title="Unknown resource">
          <div className="p-6">
            Unknown resource kind: <code>{kind}</code>.
          </div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  return (
    <FilterProvider matchFunctions={matchFunctions} syncWithUrl defaultValues={defaultK8sListFilterValues}>
      <K8sResourceListContent descriptor={descriptor} />
    </FilterProvider>
  );
}

function K8sResourceListContent({ descriptor }: { descriptor: ResourceDescriptor }) {
  const search = useSearch({ strict: false }) as { namespace?: string };
  const stored = useClusterStore((s) => s.defaultNamespace);
  const { filterFunction } = useK8sListFilter();

  const namespace = !descriptor.config.clusterScoped ? (search.namespace ?? stored ?? "") : "";

  const result = useK8sResourceList<KubeObjectBase>(descriptor.config ?? FALLBACK_CONFIG, namespace);
  const items = result.data.array;

  const tableSlots = useMemo(
    () => ({
      header: {
        component: <ListFilter descriptor={descriptor} />,
      },
    }),
    [descriptor]
  );

  const watchStatus: WatchStatus = result.error ? "error" : "connected";

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Cluster" }, { label: descriptor.sidebarGroup }, { label: descriptor.label }]}
      headerSlot={<WatchConnectionIndicator status={watchStatus} />}
    >
      <PageContentWrapper icon={Layers} title={descriptor.label}>
        <ResourceTable
          items={items}
          descriptor={descriptor}
          isLoading={result.isLoading}
          error={(result.error as Error) ?? null}
          namespace={namespace}
          filterFunction={filterFunction}
          slots={tableSlots}
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
