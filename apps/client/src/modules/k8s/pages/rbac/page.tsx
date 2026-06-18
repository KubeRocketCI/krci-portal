import { useMemo } from "react";
import { Shield } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { FilterProvider } from "@/core/providers/Filter";
import { ResourceTable } from "../../components/ResourceTable";
import { useK8sResourceListMulti } from "../../hooks/useK8sResourceListMulti";
import { resolveListNamespaces } from "../../utils/resolveListNamespaces";
import { formatK8sErrors } from "../../utils/formatK8sErrors";
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
  const descriptor = resourceRegistry[tabKey];

  return (
    <FilterProvider matchFunctions={matchFunctions} defaultValues={defaultK8sListFilterValues}>
      <RbacContent descriptor={descriptor} />
    </FilterProvider>
  );
}

function RbacContent({ descriptor }: { descriptor: ResourceDescriptor }) {
  const { form, filterFunction } = useK8sListFilter();

  // No `?namespace=` deep-link here: the RBAC route has no namespace param and its
  // tabs mix namespaced (Roles) and cluster-scoped (ClusterRoles) resources.
  const filterNamespaces = form.state.values.namespaces;
  const namespaces = useMemo(() => resolveListNamespaces({ filterNamespaces }), [filterNamespaces]);

  const result = useK8sResourceListMulti<KubeObjectBase>(descriptor.config, { namespaces });
  const items = (result.data?.array ?? []) as KubeObjectBase[];
  const errors = useMemo(() => formatK8sErrors(result.errors), [result.errors]);

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
      isLoading={result.isLoading}
      errors={errors}
      filterFunction={filterFunction}
      slots={tableSlots}
    />
  );
}
