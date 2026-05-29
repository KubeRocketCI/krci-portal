import { Layers, Trash } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { ResourceYamlTab } from "@/modules/k8s/components/ResourceYamlTab";
import { ResourceEventsTab } from "@/modules/k8s/components/ResourceEventsTab";
import { ErrorContent } from "@/core/components/ErrorContent";
import { usePermissions } from "@/k8s/api/hooks/usePermissions";
import { CRDOverviewTab } from "./tabs/OverviewTab";
import { useCRD } from "@/modules/k8s/hooks/useCRD";
import { useDetailTabs, DEFAULT_DETAIL_TABS } from "@/modules/k8s/hooks/useDetailTabs";
import { PATH_K8S_CRDS_FULL } from "@/modules/k8s/constants/paths";
import { k8sCustomResourceDefinitionConfig, type CRDObject, type K8sResourceConfig } from "@my-project/shared";
import type { RouteParams } from "@/core/router/types";

export default function CRDDetailPage() {
  const { clusterName, name } = useParams({ strict: false }) as { clusterName?: string; name?: string };
  const openDelete = useDialogOpener(DeleteKubeObjectDialog);
  const { activeTabIdx, setTab, onTabChange } = useDetailTabs(DEFAULT_DETAIL_TABS);

  const result = useCRD(name ?? "");
  const item = result.data as CRDObject | undefined;

  const perms = usePermissions({
    group: k8sCustomResourceDefinitionConfig.group,
    version: k8sCustomResourceDefinitionConfig.version,
    resourcePlural: k8sCustomResourceDefinitionConfig.pluralName,
  });

  const breadcrumbs = [
    { label: "Cluster" },
    {
      label: "CRDs",
      route: { to: PATH_K8S_CRDS_FULL, params: { clusterName: clusterName ?? "" } } as unknown as RouteParams,
    },
    { label: name ?? "" },
  ];

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
          <div className="p-6">CRD not found.</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const handleDelete = () => {
    const kind = item.spec.names.kind;
    openDelete({
      objectName: item.metadata.name,
      resourceConfig: k8sCustomResourceDefinitionConfig as K8sResourceConfig,
      resource: item,
      description: (
        <>
          <div>
            Delete CustomResourceDefinition &ldquo;<b>{kind}</b>&rdquo;.
          </div>
          <div className="text-destructive mt-2 text-sm">
            Warning: deleting this CRD will remove all <b>{kind}</b> instances cluster-wide. This action cannot be
            undone.
          </div>
        </>
      ),
    });
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      onClick: () => setTab("overview"),
      component: <CRDOverviewTab item={item} />,
    },
    {
      id: "yaml",
      label: "YAML",
      onClick: () => setTab("yaml"),
      component: <ResourceYamlTab item={item} config={k8sCustomResourceDefinitionConfig as K8sResourceConfig} />,
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
        title={item.spec.names.kind}
        description={`${item.spec.scope} · ${item.spec.group}`}
        actions={
          <ButtonWithPermission
            allowed={perms.data.delete.allowed}
            reason={perms.data.delete.reason ?? ""}
            ButtonProps={{ variant: "outline", size: "sm", onClick: handleDelete }}
          >
            <Trash size={14} className="mr-1.5" /> Delete
          </ButtonWithPermission>
        }
        tabs={tabs}
        activeTab={activeTabIdx}
        onTabChange={onTabChange}
      />
    </PageWrapper>
  );
}
