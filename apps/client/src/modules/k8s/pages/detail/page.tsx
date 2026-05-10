import { Layers, Trash } from "lucide-react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { PATH_K8S_LIST_FULL } from "../../pages/list/route";
import { Button } from "@/core/components/ui/button";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { resolveDescriptor } from "../../registry/resolve";
import { resourceRegistry } from "../../registry";
import { useK8sResourceItem } from "../../hooks/useK8sResourceItem";
import { ResourceOverviewTab } from "../../components/ResourceOverviewTab";
import { ResourceYamlTab } from "../../components/ResourceYamlTab";
import { ResourceEventsTab } from "../../components/ResourceEventsTab";
import { ErrorContent } from "@/core/components/ErrorContent";
import type { DetailVariant } from "../../registry/types";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

const DETAIL_TABS = ["overview", "yaml", "events"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

const fallbackConfig: K8sResourceConfig = {
  apiVersion: "v1",
  kind: "Unknown",
  group: "",
  version: "v1",
  singularName: "unknown",
  pluralName: "unknown",
};

export function K8sDetailPage({ expectedVariant }: { expectedVariant: DetailVariant }) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as {
    clusterName?: string;
    kind?: string;
    namespace?: string;
    name?: string;
  };
  const search = useSearch({ strict: false }) as { tab?: string };
  const openDelete = useDialogOpener(DeleteKubeObjectDialog);

  const { clusterName, kind, name } = params;
  const namespace = expectedVariant === "namespaced" ? (params.namespace ?? "") : "";
  const descriptor = kind ? resolveDescriptor(resourceRegistry, kind) : null;

  const config = descriptor?.config ?? fallbackConfig;
  const result = useK8sResourceItem<KubeObjectBase>(config, namespace, name ?? "");
  const item = result.data;

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

  if (descriptor.detailVariant !== expectedVariant) {
    return (
      <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: descriptor.label }]}>
        <PageContentWrapper icon={Layers} title="Wrong route variant">
          <div className="p-6">
            {expectedVariant === "namespaced"
              ? `Resource ${kind} is cluster-scoped; use the cluster detail route.`
              : `Resource ${kind} is namespace-scoped; use the namespaced detail route.`}
          </div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const listRoute = descriptor.listRoute
    ? { to: descriptor.listRoute as typeof PATH_K8S_LIST_FULL, params: { clusterName: clusterName ?? "" } }
    : { to: PATH_K8S_LIST_FULL, params: { clusterName: clusterName ?? "", kind: descriptor.config.pluralName } };
  const breadcrumbs = [{ label: "Cluster" }, { label: descriptor.label, route: listRoute }, { label: name ?? "" }];

  if (result.isLoading) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <PageContentWrapper icon={Layers} title={name ?? ""}>
          <div className="text-muted-foreground p-6 text-sm">Loading…</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (result.query.isError) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <PageContentWrapper icon={Layers} title={name ?? ""}>
          <div className="p-6">
            <ErrorContent error={result.query.error ?? null} />
          </div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (!item) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <PageContentWrapper icon={Layers} title={name ?? ""}>
          <div className="p-6">Resource not found.</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const activeTab: DetailTab = (DETAIL_TABS as readonly string[]).includes(search.tab ?? "")
    ? (search.tab as DetailTab)
    : "overview";
  const activeTabIdx = DETAIL_TABS.indexOf(activeTab);
  const Overview = descriptor.overviewTab ?? ResourceOverviewTab;
  const setTab = (t: DetailTab) => void navigate({ search: { ...search, tab: t } as never });

  const handleDelete = () => {
    openDelete({
      objectName: item.metadata?.name ?? "",
      resourceConfig: descriptor.config,
      resource: item,
      description: `Delete ${descriptor.label} "${item.metadata?.name ?? ""}"`,
    });
  };

  const description =
    expectedVariant === "namespaced" ? `${descriptor.label} · ${item.metadata?.namespace ?? ""}` : descriptor.label;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      onClick: () => setTab("overview"),
      component: <Overview item={item} />,
    },
    {
      id: "yaml",
      label: "YAML",
      onClick: () => setTab("yaml"),
      component: <ResourceYamlTab item={item} config={descriptor.config} />,
    },
    {
      id: "events",
      label: "Events",
      onClick: () => setTab("events"),
      component: <ResourceEventsTab item={item} />,
    },
  ];

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Cluster" },
        { label: descriptor.label, route: listRoute },
        { label: item.metadata?.name ?? "" },
      ]}
    >
      <PageContentWrapper
        icon={Layers}
        title={item.metadata?.name ?? ""}
        description={description}
        actions={
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash size={14} className="mr-1.5" /> Delete
          </Button>
        }
        tabs={tabs}
        activeTab={activeTabIdx}
        onTabChange={(_, idx) => setTab(DETAIL_TABS[idx])}
      />
    </PageWrapper>
  );
}
