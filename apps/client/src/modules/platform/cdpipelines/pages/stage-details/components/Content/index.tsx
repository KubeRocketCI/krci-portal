import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Section } from "@/core/components/Section";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { routeStageDetails } from "../../route";
import { usePageTabs } from "./hooks/usePageTabs";

export const Content = () => {
  const params = routeStageDetails.useParams();

  const { activeTab, handleChangeTab } = useTabsContext();

  const tabs = usePageTabs();

  return (
    <Section
      title={params.stage}
      enableCopyTitle
      description={
        <>
          Manage, deploy, test, and troubleshoot your applications across distinct Environments.{" "}
          <LearnMoreLink url={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.url} />
        </>
      }
    >
      <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
    </Section>
  );
};
