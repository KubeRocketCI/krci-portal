import { useMemo } from "react";
import { Puzzle, Trash } from "lucide-react";
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
import { CROverviewTab } from "./tabs/CROverviewTab";
import { useCRDByGVR } from "@/modules/k8s/hooks/useCRDByGVR";
import { useCR } from "@/modules/k8s/hooks/useCR";
import { useDetailTabs, DEFAULT_DETAIL_TABS } from "@/modules/k8s/hooks/useDetailTabs";
import { buildCRDescriptor } from "@/modules/k8s/registry/dynamic/buildCRDescriptor";
import type { CRDObject } from "@my-project/shared";
import type { DetailVariant } from "@/modules/k8s/registry/types";

/**
 * A minimal valid CRDObject placeholder used while the real CRD is still loading.
 * Satisfies the CRDObject shape so buildCRDescriptor (called inside useCR) can run
 * without crashing. The watch hook inside useCR will be disabled because `name` is
 * empty until the CRD resolves.
 */
const PENDING_CRD: CRDObject = {
  apiVersion: "apiextensions.k8s.io/v1",
  kind: "CustomResourceDefinition",
  metadata: {
    name: "_pending",
    uid: "_pending",
    creationTimestamp: "",
  },
  spec: {
    group: "",
    scope: "Cluster",
    names: {
      kind: "_Pending",
      plural: "_pending",
      singular: "_pending",
    },
    versions: [{ name: "v1", served: true, storage: true }],
  },
};

// Computed once: buildCRDescriptor(PENDING_CRD) is a constant, so reuse it during the
// loading window instead of re-invoking the factory on every render.
const PENDING_CONFIG = buildCRDescriptor(PENDING_CRD, "v1").config;

export default function CRDetailView({ expectedVariant }: { expectedVariant: DetailVariant }) {
  const params = useParams({ strict: false }) as {
    group?: string;
    version?: string;
    plural?: string;
    namespace?: string;
    name?: string;
  };
  const openDelete = useDialogOpener(DeleteKubeObjectDialog);
  const { activeTabIdx, setTab, onTabChange } = useDetailTabs(DEFAULT_DETAIL_TABS);

  const { group = "", version = "", plural = "", namespace = "", name = "" } = params;

  const crdResult = useCRDByGVR(group, version, plural);
  const crd = crdResult.crd;

  // Always call useCR unconditionally — use the real CRD once available, otherwise the
  // placeholder so buildCRDescriptor doesn't blow up on a missing versions array.
  // Gate the inner useWatchItem on `crd` being resolved: without this, the placeholder's
  // (group "", plural "_pending") would be paired with the URL-derived name to issue a
  // bogus GET against /api/v1/_pending/<name>, producing a 404 + a useless K8s audit log.
  const result = useCR(crd ?? PENDING_CRD, namespace, name, version, { enabled: !!crd });

  // Derive descriptor after both hooks are called. Memoize so identical (crd, version)
  // inputs return a referentially stable descriptor, matching the cached config produced
  // by useCR and avoiding redundant column-array allocations on every render.
  const descriptor = useMemo(() => (crd ? buildCRDescriptor(crd, version) : null), [crd, version]);
  // Fallback to PENDING_CRD's config during the loading window so downstream components
  // (e.g. ResourceYamlTab, permission hook) receive a valid K8sResourceConfig shape.
  const config = descriptor?.config ?? PENDING_CONFIG;

  // Permission check uses the resolved CR's GVR. While the CRD is still loading,
  // disable the query entirely (avoid a spurious SelfSubjectAccessReview against
  // PENDING_CRD's placeholder pluralName); defaultPermissions keep Delete disabled.
  const perms = usePermissions({
    group: config.group,
    version: config.version,
    resourcePlural: config.pluralName,
    enabled: !!crd,
  });

  const breadcrumbs = [
    { label: "Cluster" },
    { label: "Custom Resources" },
    { label: descriptor?.label ?? "" },
    { label: name },
  ];

  if (crdResult.isLoading) {
    return (
      <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Custom Resources" }]}>
        <PageContentWrapper icon={Puzzle} title="Loading…">
          <div className="text-muted-foreground p-6 text-sm">Loading…</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (crdResult.error || !crd || !descriptor) {
    return (
      <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Custom Resources" }]}>
        <PageContentWrapper icon={Puzzle} title="Unknown custom resource">
          <div className="p-6">
            Unknown: <code>{`${group}/${version}/${plural}`}</code>
          </div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (descriptor.detailVariant !== expectedVariant) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs.slice(0, 3)}>
        <PageContentWrapper icon={Puzzle} title="Wrong route variant">
          <div className="p-6">CRD is {descriptor.detailVariant}-scoped; use the correct detail route.</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (result.isLoading) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <PageContentWrapper icon={Puzzle} title={name}>
          <div className="text-muted-foreground p-6 text-sm">Loading…</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (result.query.isError) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <PageContentWrapper icon={Puzzle} title={name}>
          <div className="p-6">
            <ErrorContent error={result.query.error ?? null} />
          </div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const item = result.data;

  if (!item) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <PageContentWrapper icon={Puzzle} title={name}>
          <div className="p-6">Resource not found.</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const OverrideOverview = descriptor.overviewTab;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      onClick: () => setTab("overview"),
      component: OverrideOverview ? (
        <OverrideOverview item={item} />
      ) : (
        <CROverviewTab crd={crd} item={item} version={version} />
      ),
    },
    {
      id: "yaml",
      label: "YAML",
      onClick: () => setTab("yaml"),
      component: <ResourceYamlTab item={item} config={config} />,
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
        icon={Puzzle}
        title={item.metadata?.name ?? ""}
        description={
          expectedVariant === "namespaced"
            ? `${descriptor.label} · ${item.metadata?.namespace ?? ""}`
            : descriptor.label
        }
        actions={
          <ButtonWithPermission
            allowed={perms.data.delete.allowed}
            reason={perms.data.delete.reason ?? ""}
            ButtonProps={{
              variant: "outline",
              size: "sm",
              onClick: () =>
                openDelete({
                  objectName: item.metadata?.name ?? "",
                  resourceConfig: config,
                  resource: item,
                  description: `Delete ${descriptor.label} "${item.metadata?.name ?? ""}"`,
                }),
            }}
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
