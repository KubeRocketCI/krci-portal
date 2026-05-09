import { Link2 } from "lucide-react";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { PATH_TRIGGER_BINDINGS_FULL } from "../trigger-binding-list/route";
import { useTriggerBindingWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routeTriggerBindingDetails } from "./route";

export default function TriggerBindingDetailsView({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routeTriggerBindingDetails.useParams();
  const watch = useTriggerBindingWatch();
  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();
  const showTabs = !watch.query.error && !watch.query.isLoading;

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Webhook Triggers" },
        { label: "Trigger Bindings", route: { to: PATH_TRIGGER_BINDINGS_FULL } },
        { label: params.name },
      ]}
    >
      <PageContentWrapper
        icon={Link2}
        title={params.name}
        enableCopyTitle
        description="Webhook payload → TriggerTemplate parameter mapping."
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
