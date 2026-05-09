import { Funnel } from "lucide-react";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { PATH_INTERCEPTORS_FULL } from "../interceptor-list/route";
import { useInterceptorWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routeInterceptorDetails } from "./route";

export default function InterceptorDetailsView({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routeInterceptorDetails.useParams();
  const watch = useInterceptorWatch();
  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();
  const showTabs = !watch.query.error && !watch.query.isLoading;

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Webhook Triggers" },
        { label: "Interceptors", route: { to: PATH_INTERCEPTORS_FULL } },
        { label: params.name },
      ]}
    >
      <PageContentWrapper
        icon={Funnel}
        title={params.name}
        enableCopyTitle
        description="Namespace-scoped CEL/HTTP webhook filter."
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
