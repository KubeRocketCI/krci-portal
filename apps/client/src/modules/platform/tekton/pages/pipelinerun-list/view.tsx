import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { useTabs } from "./hooks/useTabs";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { Bot } from "lucide-react";

export default function PipelineRunListView() {
  const { activeTab, handleChangeTab } = useTabsContext();
  const tabs = useTabs();

  return (
    <PageWrapper
      breadcrumbs={[{ label: "PipelineRuns" }]}
      headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.PIPELINES.url} />}
    >
      <Section
        icon={Bot}
        title="PipelineRuns"
        description="Monitor the progress of overall pipeline runs launched within the platform."
      >
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </Section>
    </PageWrapper>
  );
}
