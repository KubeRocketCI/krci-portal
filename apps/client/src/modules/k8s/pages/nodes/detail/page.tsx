import { Server, Trash } from "lucide-react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { PATH_K8S_NODES_FULL } from "@/modules/k8s/constants/paths";
import { Button } from "@/core/components/ui/button";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useK8sResourceItem } from "../../../hooks/useK8sResourceItem";
import { k8sNodeConfig, type Node } from "@my-project/shared";
import { ResourceOverviewTab } from "../../../components/ResourceOverviewTab";
import { ResourceYamlTab } from "../../../components/ResourceYamlTab";
import { ResourceEventsTab } from "../../../components/ResourceEventsTab";
import { ErrorContent } from "@/core/components/ErrorContent";
import { ConditionsTab } from "./tabs/ConditionsTab";
import { ChartsTab } from "./tabs/ChartsTab";

const NODE_TABS = ["overview", "yaml", "events", "conditions", "charts"] as const;
type NodeTab = (typeof NODE_TABS)[number];

export default function K8sNodeDetailPage() {
  const navigate = useNavigate();
  const { clusterName, name } = useParams({ strict: false }) as { clusterName?: string; name?: string };
  const search = useSearch({ strict: false }) as { tab?: string };
  const openDelete = useDialogOpener(DeleteKubeObjectDialog);

  const result = useK8sResourceItem<Node>(k8sNodeConfig, "", name ?? "");
  const item = result.data;

  if (result.isLoading) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Cluster" },
          { label: "Nodes", route: { to: PATH_K8S_NODES_FULL, params: { clusterName: clusterName ?? "" } } },
          { label: name ?? "" },
        ]}
      >
        <PageContentWrapper icon={Server} title={name ?? ""}>
          <div className="text-muted-foreground p-6 text-sm">Loading…</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (result.query.isError) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Cluster" },
          { label: "Nodes", route: { to: PATH_K8S_NODES_FULL, params: { clusterName: clusterName ?? "" } } },
          { label: name ?? "" },
        ]}
      >
        <PageContentWrapper icon={Server} title={name ?? ""}>
          <div className="p-6">
            <ErrorContent error={result.query.error ?? null} />
          </div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (!item) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Cluster" },
          { label: "Nodes", route: { to: PATH_K8S_NODES_FULL, params: { clusterName: clusterName ?? "" } } },
          { label: name ?? "" },
        ]}
      >
        <PageContentWrapper icon={Server} title={name ?? ""}>
          <div className="p-6">Node not found.</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const activeTab: NodeTab = (NODE_TABS as readonly string[]).includes(search.tab ?? "")
    ? (search.tab as NodeTab)
    : "overview";
  const activeTabIdx = NODE_TABS.indexOf(activeTab);
  const setTab = (t: NodeTab) => void navigate({ search: { ...search, tab: t } as never });

  const handleDelete = () => {
    openDelete({
      objectName: item.metadata?.name ?? "",
      resourceConfig: k8sNodeConfig,
      resource: item as never,
      description: `Delete Node "${item.metadata?.name ?? ""}"`,
    });
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      onClick: () => setTab("overview"),
      component: <ResourceOverviewTab item={item} />,
    },
    {
      id: "yaml",
      label: "YAML",
      onClick: () => setTab("yaml"),
      component: <ResourceYamlTab item={item} config={k8sNodeConfig} />,
    },
    {
      id: "events",
      label: "Events",
      onClick: () => setTab("events"),
      component: <ResourceEventsTab item={item} />,
    },
    {
      id: "conditions",
      label: "Conditions",
      onClick: () => setTab("conditions"),
      component: <ConditionsTab node={item} />,
    },
    {
      id: "charts",
      label: "Charts",
      onClick: () => setTab("charts"),
      component: <ChartsTab />,
    },
  ];

  return (
    <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Nodes" }, { label: item.metadata?.name ?? "" }]}>
      <PageContentWrapper
        icon={Server}
        title={item.metadata?.name ?? ""}
        description="Node"
        actions={
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash size={14} className="mr-1.5" /> Delete
          </Button>
        }
        tabs={tabs}
        activeTab={activeTabIdx}
        onTabChange={(_, idx) => setTab(NODE_TABS[idx])}
      />
    </PageWrapper>
  );
}
