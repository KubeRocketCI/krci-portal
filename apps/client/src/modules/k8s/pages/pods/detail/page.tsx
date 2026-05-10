import { Box, Trash } from "lucide-react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { PATH_K8S_PODS_FULL } from "@/modules/k8s/constants/paths";
import { Button } from "@/core/components/ui/button";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { usePodWatchItem } from "@/k8s/api/groups/Core/Pod/hooks";
import { k8sPodConfig } from "@my-project/shared";
import { ResourceYamlTab } from "../../../components/ResourceYamlTab";
import { ResourceEventsTab } from "../../../components/ResourceEventsTab";
import { ErrorContent } from "@/core/components/ErrorContent";
import { OverviewTab } from "./tabs/OverviewTab";
import { ContainersTab } from "./tabs/ContainersTab";
import { ConditionsTab } from "./tabs/ConditionsTab";
import { VolumesTab } from "./tabs/VolumesTab";
import { LogsTab } from "./tabs/LogsTab";
import { ShellTab } from "./tabs/ShellTab";

const POD_TABS = ["overview", "containers", "yaml", "events", "conditions", "volumes", "logs", "shell"] as const;
type PodTab = (typeof POD_TABS)[number];

export default function K8sPodDetailPage() {
  const navigate = useNavigate();
  const { clusterName, namespace, name } = useParams({ strict: false }) as {
    clusterName?: string;
    namespace?: string;
    name?: string;
  };
  const search = useSearch({ strict: false }) as { tab?: string; container?: string };
  const openDelete = useDialogOpener(DeleteKubeObjectDialog);

  const result = usePodWatchItem({ namespace: namespace ?? "", name: name ?? "" });
  const item = result.data;

  const breadcrumbs = [
    { label: "Cluster" },
    { label: "Pods", route: { to: PATH_K8S_PODS_FULL, params: { clusterName: clusterName ?? "" } } },
    { label: name ?? "" },
  ];

  if (result.isLoading) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <PageContentWrapper icon={Box} title={name ?? ""}>
          <div className="text-muted-foreground p-6 text-sm">Loading…</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (result.query.isError) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <PageContentWrapper icon={Box} title={name ?? ""}>
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
        <PageContentWrapper icon={Box} title={name ?? ""}>
          <div className="p-6">Pod not found.</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const containers = item.spec?.containers ?? [];
  const activeTab: PodTab = (POD_TABS as readonly string[]).includes(search.tab ?? "")
    ? (search.tab as PodTab)
    : "overview";
  const activeTabIdx = POD_TABS.indexOf(activeTab);
  const container = search.container ?? containers[0]?.name ?? "";
  const setTab = (t: PodTab) => void navigate({ search: { ...search, tab: t } as never });

  const handleDelete = () => {
    openDelete({
      objectName: item.metadata?.name ?? "",
      resourceConfig: k8sPodConfig,
      resource: item as never,
      description: `Delete Pod "${item.metadata?.name ?? ""}"`,
    });
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      onClick: () => setTab("overview"),
      component: <OverviewTab pod={item} />,
    },
    {
      id: "containers",
      label: "Containers",
      onClick: () => setTab("containers"),
      component: <ContainersTab pod={item} />,
    },
    {
      id: "yaml",
      label: "YAML",
      onClick: () => setTab("yaml"),
      component: <ResourceYamlTab item={item} config={k8sPodConfig} />,
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
      component: <ConditionsTab pod={item} />,
    },
    {
      id: "volumes",
      label: "Volumes",
      onClick: () => setTab("volumes"),
      component: <VolumesTab pod={item} />,
    },
    {
      id: "logs",
      label: "Logs",
      onClick: () => setTab("logs"),
      component: <LogsTab pod={item} container={container} />,
    },
    {
      id: "shell",
      label: "Shell",
      onClick: () => setTab("shell"),
      component: <ShellTab pod={item} container={container} />,
    },
  ];

  return (
    <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Pods" }, { label: item.metadata?.name ?? "" }]}>
      <PageContentWrapper
        icon={Box}
        title={item.metadata?.name ?? ""}
        description={`Pod · ${item.metadata?.namespace ?? ""}`}
        actions={
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash size={14} className="mr-1.5" /> Delete
          </Button>
        }
        tabs={tabs}
        activeTab={activeTabIdx}
        onTabChange={(_, idx) => setTab(POD_TABS[idx])}
      />
    </PageWrapper>
  );
}
