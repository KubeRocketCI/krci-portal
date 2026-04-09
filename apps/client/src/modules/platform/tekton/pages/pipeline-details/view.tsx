import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { PATH_PIPELINES_FULL } from "../pipeline-list/route";
import { HeaderActions } from "./components/HeaderActions";
import { usePipelineWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routePipelineDetails } from "./route";

export default function PipelineDetailsPageContent({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routePipelineDetails.useParams();
  const pipelineWatch = usePipelineWatch();
  const pipeline = pipelineWatch.query.data;

  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();

  const showTabs = !pipelineWatch.query.error && !pipelineWatch.query.isLoading;

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Pipelines",
          route: {
            to: PATH_PIPELINES_FULL,
          },
        },
        {
          label: params.name,
        },
      ]}
    >
      <PageContentWrapper
        icon={ENTITY_ICON.pipeline}
        title={params.name}
        enableCopyTitle
        description="Browse and visualize your Tekton pipelines. View pipeline definitions and their task dependencies."
        actions={pipelineWatch.isReady && pipeline && <HeaderActions />}
        tabs={showTabs ? tabs : undefined}
        activeTab={searchTabIdx}
        onTabChange={handleChangeTab}
      >
        {pipelineWatch.query.error && <ErrorContent error={pipelineWatch.query.error} />}
        {pipelineWatch.query.isLoading && <LoadingWrapper isLoading>{null}</LoadingWrapper>}
      </PageContentWrapper>
    </PageWrapper>
  );
}
