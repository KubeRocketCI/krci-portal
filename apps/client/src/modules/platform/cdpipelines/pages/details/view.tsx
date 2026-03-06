import { PageWrapper } from "@/core/components/PageWrapper";
import { PageGuideButton } from "@/core/components/PageGuide";
import { PATH_CDPIPELINES_FULL } from "../list/route";
import { HeaderActions, HeaderLinks } from "./components/HeaderActions";
import { routeCDPipelineDetails, PATH_CDPIPELINE_DETAILS_FULL } from "./route";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { CloudUpload } from "lucide-react";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { useTabs } from "./hooks/useTabs";

export default function CDPipelineDetailsPageContent({ searchTabIdx }: { searchTabIdx: number }) {
  const { name, namespace, clusterName } = routeCDPipelineDetails.useParams();
  const { handleChangeTab } = useTabsContext();
  const tabs = useTabs();

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Deployments",
          route: {
            to: PATH_CDPIPELINES_FULL,
            params: {
              clusterName,
            },
          },
        },
        {
          label: name,
        },
      ]}
      headerSlot={
        <>
          <PageGuideButton tourId="deploymentDetailsTour" />
        </>
      }
    >
      <PageContentWrapper
        icon={CloudUpload}
        title={name}
        enableCopyTitle
        pinConfig={{
          key: `deployment:${namespace}/${name}`,
          label: name,
          type: "deployment",
          route: {
            to: PATH_CDPIPELINE_DETAILS_FULL,
            params: { clusterName, namespace, name },
          },
        }}
        description="Manage and monitor your deployment environments across clusters. Each environment represents a stage in your artifact's progression path from development to production."
        actions={<HeaderActions />}
        extraLinks={<HeaderLinks />}
        tabs={tabs}
        activeTab={searchTabIdx}
        onTabChange={handleChangeTab}
        tabDataTour="deployment-tabs"
      />
    </PageWrapper>
  );
}
