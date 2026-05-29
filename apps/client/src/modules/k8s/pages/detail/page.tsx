import { Layers, Trash } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { PATH_K8S_LIST_FULL } from "@/modules/k8s/constants/paths";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { usePermissions } from "@/k8s/api/hooks/usePermissions";
import { resolveDescriptor } from "../../registry/resolve";
import { resourceRegistry } from "../../registry";
import { useK8sResourceItem } from "../../hooks/useK8sResourceItem";
import { useDetailTabs, DEFAULT_DETAIL_TABS } from "../../hooks/useDetailTabs";
import { ResourceOverviewTab } from "../../components/ResourceOverviewTab";
import { ResourceYamlTab } from "../../components/ResourceYamlTab";
import { ResourceEventsTab } from "../../components/ResourceEventsTab";
import { ErrorContent } from "@/core/components/ErrorContent";
import type { DetailVariant } from "../../registry/types";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

const fallbackConfig: K8sResourceConfig = {
  apiVersion: "v1",
  kind: "Unknown",
  group: "",
  version: "v1",
  singularName: "unknown",
  pluralName: "unknown",
};

export function K8sDetailPage({ expectedVariant }: { expectedVariant: DetailVariant }) {
  const params = useParams({ strict: false }) as {
    clusterName?: string;
    kind?: string;
    namespace?: string;
    name?: string;
  };
  const openDelete = useDialogOpener(DeleteKubeObjectDialog);
  const { activeTabIdx, setTab, onTabChange } = useDetailTabs(DEFAULT_DETAIL_TABS);

  const { clusterName, kind, name } = params;
  const namespace = expectedVariant === "namespaced" ? (params.namespace ?? "") : "";
  const descriptor = kind ? resolveDescriptor(resourceRegistry, kind) : null;

  const config = descriptor?.config ?? fallbackConfig;
  const result = useK8sResourceItem<KubeObjectBase>(config, namespace, name ?? "");
  const item = result.data;

  // Permission check uses the resolved resource's GVR. For unknown kinds the
  // hook is disabled to avoid a spurious SelfSubjectAccessReview against the
  // "Unknown" fallback config; defaultPermissions keep Delete safely disabled.
  const perms = usePermissions({
    group: config.group,
    version: config.version,
    resourcePlural: config.pluralName,
    enabled: !!descriptor,
  });

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

  const Overview = descriptor.overviewTab ?? ResourceOverviewTab;

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
    <PageWrapper breadcrumbs={breadcrumbs}>
      <PageContentWrapper
        icon={Layers}
        title={item.metadata?.name ?? ""}
        description={description}
        actions={
          <>
            {descriptor.actionsSlot && <descriptor.actionsSlot item={item} />}
            <ButtonWithPermission
              allowed={perms.data.delete.allowed}
              reason={perms.data.delete.reason ?? ""}
              ButtonProps={{ variant: "outline", size: "sm", onClick: handleDelete }}
            >
              <Trash size={14} className="mr-1.5" /> Delete
            </ButtonWithPermission>
          </>
        }
        tabs={tabs}
        activeTab={activeTabIdx}
        onTabChange={onTabChange}
      />
    </PageWrapper>
  );
}
