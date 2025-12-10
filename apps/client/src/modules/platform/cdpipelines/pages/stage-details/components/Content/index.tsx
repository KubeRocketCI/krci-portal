import React from "react";
import { Section } from "@/core/components/Section";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { routeStageDetails } from "../../route";
import { usePageTabs } from "./hooks/usePageTabs";
import { Layers } from "lucide-react";
import { HeaderActions, HeaderLinks } from "../HeaderActions";

export const Content = () => {
  const params = routeStageDetails.useParams();
  const { tab } = routeStageDetails.useSearch();

  const tabs = usePageTabs();

  const activeTabIdx = React.useMemo(() => {
    const idx = tabs.findIndex((t) => t.id === tab);
    return idx >= 0 ? idx : 0;
  }, [tabs, tab]);

  const handleChangeTab = React.useCallback(
    (_event: React.ChangeEvent<object> | null, newActiveTabIdx: number) => {
      const newTab = tabs[newActiveTabIdx];
      if (newTab?.onClick) {
        newTab.onClick();
      }
    },
    [tabs]
  );

  return (
    <Section
      icon={Layers}
      title={params.stage}
      enableCopyTitle
      description="Manage, deploy, test, and troubleshoot your applications across distinct Environments."
      actions={<HeaderActions />}
      extraContent={<HeaderLinks />}
    >
      <Tabs tabs={tabs} activeTabIdx={activeTabIdx} handleChangeTab={handleChangeTab} />
    </Section>
  );
};
