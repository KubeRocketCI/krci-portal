import { FileCode } from "lucide-react";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { PATH_TRIGGER_TEMPLATES_FULL } from "../trigger-template-list/route";
import { useTriggerTemplateWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routeTriggerTemplateDetails } from "./route";

export default function TriggerTemplateDetailsView({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routeTriggerTemplateDetails.useParams();
  const watch = useTriggerTemplateWatch();
  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();
  const showTabs = !watch.query.error && !watch.query.isLoading;

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Webhook Triggers" },
        { label: "Trigger Templates", route: { to: PATH_TRIGGER_TEMPLATES_FULL } },
        { label: params.name },
      ]}
    >
      <PageContentWrapper
        icon={FileCode}
        title={params.name}
        enableCopyTitle
        description="PipelineRun blueprint."
        tabs={showTabs ? tabs : undefined}
        activeTab={searchTabIdx}
        onTabChange={handleChangeTab}
      >
        {watch.query.error && <ErrorContent error={watch.query.error} />}
        {watch.query.isLoading && <LoadingWrapper isLoading>{null}</LoadingWrapper>}
      </PageContentWrapper>
    </PageWrapper>
  );
}
