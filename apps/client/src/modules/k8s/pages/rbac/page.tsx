import { useMemo } from "react";
import { Shield } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { FilterProvider } from "@/core/providers/Filter";
import { ResourceTable } from "../../components/ResourceTable";
import { useK8sResourceList } from "../../hooks/useK8sResourceList";
import { useClusterStore } from "@/k8s/store";
import { resourceRegistry } from "../../registry";
import { ListFilter } from "../list/components/ListFilter";
import { defaultK8sListFilterValues, matchFunctions } from "../list/components/ListFilter/constants";
import { useK8sListFilter } from "../list/components/ListFilter/hooks/useK8sListFilter";
import type { KubeObjectBase } from "@my-project/shared";
import type { ResourceDescriptor } from "../../registry/types";

const RBAC_TABS = [
  { key: "roles" as const, label: "Roles" },
  { key: "rolebindings" as const, label: "Role Bindings" },
  { key: "clusterroles" as const, label: "Cluster Roles" },
  { key: "clusterrolebindings" as const, label: "Cluster Role Bindings" },
];

type RbacTab = (typeof RBAC_TABS)[number]["key"];
const RBAC_TAB_KEYS = RBAC_TABS.map((t) => t.key) as readonly RbacTab[];

export default function K8sRbacOverviewPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: RbacTab };
  const activeTab: RbacTab = (RBAC_TAB_KEYS as readonly string[]).includes(search.tab ?? "")
    ? (search.tab as RbacTab)
    : "roles";
  const activeTabIdx = RBAC_TAB_KEYS.indexOf(activeTab);
  const setTab = (t: RbacTab) => void navigate({ search: { ...search, tab: t } as never });

  const tabs = RBAC_TABS.map(({ key, label }) => ({
    id: key,
    label,
    onClick: () => setTab(key),
    component: <RbacTabPanel tabKey={key} />,
  }));

  return (
    <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "RBAC" }]}>
      <PageContentWrapper
        icon={Shield}
        title="RBAC"
        tabs={tabs}
        activeTab={activeTabIdx}
        onTabChange={(_, idx) => setTab(RBAC_TAB_KEYS[idx])}
      />
    </PageWrapper>
  );
}

function RbacTabPanel({ tabKey }: { tabKey: RbacTab }) {
  const stored = useClusterStore((s) => s.defaultNamespace);
  const descriptor = resourceRegistry[tabKey];
  const namespace = descriptor && !descriptor.config.clusterScoped ? (stored ?? "") : "";
  const result = useK8sResourceList<KubeObjectBase>(descriptor.config, namespace);
  const items = (result.data?.array ?? []) as KubeObjectBase[];

  return (
    <FilterProvider matchFunctions={matchFunctions} defaultValues={defaultK8sListFilterValues}>
      <RbacContent
        descriptor={descriptor}
        items={items}
        isLoading={result.isLoading}
        error={(result.error as Error) ?? null}
        namespace={namespace}
      />
    </FilterProvider>
  );
}

function RbacContent({
  descriptor,
  items,
  isLoading,
  error,
  namespace,
}: {
  descriptor: ResourceDescriptor;
  items: KubeObjectBase[];
  isLoading: boolean;
  error: Error | null;
  namespace: string;
}) {
  const { filterFunction } = useK8sListFilter();

  const tableSlots = useMemo(
    () => ({
      header: {
        component: <ListFilter descriptor={descriptor} />,
      },
    }),
    [descriptor]
  );

  return (
    <ResourceTable
      items={items}
      descriptor={descriptor}
      isLoading={isLoading}
      error={error}
      namespace={namespace}
      filterFunction={filterFunction}
      slots={tableSlots}
    />
  );
}
