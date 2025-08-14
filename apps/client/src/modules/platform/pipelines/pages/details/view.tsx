import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Stack, Typography } from "@mui/material";
import { TriangleAlert } from "lucide-react";
import React from "react";
import { PipelineActionsMenu } from "../../components/PipelineActionsMenu";
import { routePipelineList } from "../list/route";
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
        <Stack spacing={1}>
          <LoadingWrapper isLoading={false}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <TriangleAlert size={48} />
              <Stack spacing={1} direction="row" alignItems="center">
                <Typography component="span" fontSize={(t) => t.typography.pxToRem(14)} color="#596D80">
                  No pipeline was found for the requested resource. Please ensure you have checked the correct resource.
                </Typography>
              </Stack>
            </Stack>
          </LoadingWrapper>
        </Stack>
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
      <Stack direction="row" spacing={2} alignItems="center">
        <PipelineActionsMenu
          data={{
            pipeline: pipeline!,
          }}
          variant="inline"
        />
      </Stack>
    );
  };

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Pipelines",
          route: {
            to: routePipelineList.to,
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
