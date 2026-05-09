import { Zap } from "lucide-react";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { PATH_TRIGGERS_FULL } from "../trigger-list/route";
import { useTriggerWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routeTriggerDetails } from "./route";

export default function TriggerDetailsView({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routeTriggerDetails.useParams();
  const watch = useTriggerWatch();
  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();
  const showTabs = !watch.query.error && !watch.query.isLoading;

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Webhook Triggers" },
        { label: "Triggers", route: { to: PATH_TRIGGERS_FULL } },
        { label: params.name },
      ]}
    >
      <PageContentWrapper
        icon={Zap}
        title={params.name}
        enableCopyTitle
        description="Webhook trigger configuration: bindings + interceptors + template."
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
