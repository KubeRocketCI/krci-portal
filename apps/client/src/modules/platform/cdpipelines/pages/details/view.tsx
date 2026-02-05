import { PageWrapper } from "@/core/components/PageWrapper";
import { PATH_CDPIPELINES_FULL } from "../list/route";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { HeaderActions, HeaderLinks } from "./components/HeaderActions";
import { routeCDPipelineDetails } from "./route";
import { Section } from "@/core/components/Section";
import { CloudUpload } from "lucide-react";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { useTabs } from "./hooks/useTabs";

export default function CDPipelineDetailsPageContent() {
  const { name, clusterName } = routeCDPipelineDetails.useParams();
  const { activeTab, handleChangeTab } = useTabsContext();
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
      headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.url} />}
    >
      <Section
        icon={CloudUpload}
        title={name}
        enableCopyTitle
        description="Manage and monitor your deployment environments across clusters. Each environment represents a stage in your artifact's progression path from development to production."
        actions={<HeaderActions />}
        extraContent={<HeaderLinks />}
      >
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </Section>
    </PageWrapper>
  );
}
