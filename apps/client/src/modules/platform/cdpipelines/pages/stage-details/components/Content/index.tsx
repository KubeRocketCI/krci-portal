import React from "react";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { routeStageDetails, PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "../../route";
import { usePageTabs } from "./hooks/usePageTabs";
import { Layers } from "lucide-react";
import { HeaderActions, HeaderLinks } from "../HeaderActions";
import { PrototypeDefectDojoProvider } from "@/modules/platform/security/prototype-defectdojo/api/provider";

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

  // PROTOTYPE (EPMDEDP-16072): one DefectDojo cache scope for the Overview and Applications tabs. Not for main.
  const securityCacheScope = `stage-${params.cdPipeline}-${params.stage}`;

  return (
    <PrototypeDefectDojoProvider key={securityCacheScope} cacheScope={securityCacheScope}>
      <PageContentWrapper
        icon={Layers}
        title={params.stage}
        enableCopyTitle
        pinConfig={{
          label: params.stage,
          route: {
            to: PATH_CDPIPELINE_STAGE_DETAILS_FULL,
            params: {
              clusterName: params.clusterName,
              namespace: params.namespace,
              cdPipeline: params.cdPipeline,
              stage: params.stage,
            },
          },
        }}
        description="Manage, deploy, test, and troubleshoot your applications across distinct Environments."
        actions={<HeaderActions />}
        extraLinks={<HeaderLinks />}
        tabs={tabs}
        activeTab={activeTabIdx}
        onTabChange={handleChangeTab}
        tabDataTour="stage-tabs"
      />
    </PrototypeDefectDojoProvider>
  );
};
