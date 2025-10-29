import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { TriangleAlert } from "lucide-react";
import React from "react";
import { PipelineActionsMenu } from "../../components/PipelineActionsMenu";
import { PATH_PIPELINES_FULL } from "../list/route";
import { usePipelineWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routePipelineDetails } from "./route";

export default function PipelineDetailsPageContent() {
  const params = routePipelineDetails.useParams();
  const pipelineWatch = usePipelineWatch();
  const pipeline = pipelineWatch.query.data;

  const tabs = useTabs();
  const { activeTab, handleChangeTab } = useTabsContext();

  const renderPageContent = React.useCallback(() => {
    if (pipelineWatch.query.error) {
      return (
        <div className="flex flex-col gap-1">
          <LoadingWrapper isLoading={false}>
            <div className="flex items-center justify-center gap-1">
              <TriangleAlert size={48} />
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  No pipeline was found for the requested resource. Please ensure you have checked the correct resource.
                </span>
              </div>
            </div>
          </LoadingWrapper>
        </div>
      );
    }

    return (
      <LoadingWrapper isLoading={pipelineWatch.query.isLoading}>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [pipelineWatch.query.error, pipelineWatch.query.isLoading, tabs, activeTab, handleChangeTab]);

  const renderHeaderSlot = () => {
    if (!pipelineWatch.isReady || !pipeline) {
      return <></>;
    }

    return (
      <div className="flex items-center gap-2">
        <PipelineActionsMenu
          data={{
            pipeline: pipeline!,
          }}
          variant="inline"
        />
      </div>
    );
  };

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
      headerSlot={renderHeaderSlot()}
    >
      {renderPageContent()}
    </PageWrapper>
  );
}
