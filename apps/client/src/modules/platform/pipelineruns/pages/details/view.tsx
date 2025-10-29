import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { getPullRequestURL } from "@my-project/shared";
import { SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { PipelineRunActionsMenu } from "../../components/PipelineRunActionsMenu";
import { PATH_PIPELINERUNS_FULL } from "../list/route";
import { ReserveLogs } from "./components/ReserveLogs";
import { usePipelineRunWatchWithPageParams } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routePipelineRunDetails } from "./route";

export default function PipelineRunDetailsPageContent() {
  const params = routePipelineRunDetails.useParams();
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const pipelineRun = pipelineRunWatch.query.data;

  const tabs = useTabs();
  const { activeTab, handleChangeTab } = useTabsContext();

  const renderPageContent = React.useCallback(() => {
    if (pipelineRunWatch.query.isError) {
      return <ReserveLogs />;
    }

    return (
      <LoadingWrapper isLoading={pipelineRunWatch.query.isLoading}>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [pipelineRunWatch.query.isError, pipelineRunWatch.query.isLoading, tabs, activeTab, handleChangeTab]);

  const renderHeaderSlot = () => {
    if (!pipelineRunWatch.isReady || !pipelineRun) {
      return <></>;
    }

    const pullRequestLink = getPullRequestURL(pipelineRun!);

    return (
      <div className="flex items-center gap-2">
        {pullRequestLink && (
          <div>
            <ResourceIconLink
              tooltipTitle={"Go to the Pull Request page"}
              link={pullRequestLink}
              Icon={<SquareArrowOutUpRight />}
              name="pull request"
              isTextButton
              variant="outlined"
              size="small"
            />
          </div>
        )}
        <PipelineRunActionsMenu
          data={{
            pipelineRun: pipelineRun!,
          }}
          backRoute={{
            to: PATH_PIPELINERUNS_FULL,
            params: {
              clusterName: params.clusterName,
            },
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
          label: "PipelineRuns",
          route: {
            to: PATH_PIPELINERUNS_FULL,
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
