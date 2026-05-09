import { Globe } from "lucide-react";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { PATH_CLUSTER_INTERCEPTORS_FULL } from "../cluster-interceptor-list/route";
import { useClusterInterceptorWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routeClusterInterceptorDetails } from "./route";

export default function ClusterInterceptorDetailsView({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routeClusterInterceptorDetails.useParams();
  const watch = useClusterInterceptorWatch();
  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();
  const showTabs = !watch.query.error && !watch.query.isLoading;

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Webhook Triggers" },
        { label: "Cluster Interceptors", route: { to: PATH_CLUSTER_INTERCEPTORS_FULL } },
        { label: params.name },
      ]}
    >
      <PageContentWrapper
        icon={Globe}
        title={params.name}
        enableCopyTitle
        description="Cluster-scoped interceptor implementation."
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
