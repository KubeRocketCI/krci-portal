import { ContentErrorBoundary } from "@/core/components/DetailsPageWrapper";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Stack, Typography } from "@mui/material";
import { getPullRequestURL } from "@my-project/shared";
import { SquareArrowOutUpRight, TriangleAlert } from "lucide-react";
import React from "react";
import { PipelineRunActionsMenu } from "../../components/PipelineRunActionsMenu";
import { routePipelineRunList } from "../list/route";
// import { ReserveLogs } from "./components/ReserveLogs";
import { usePipelineRunWatch } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routePipelineRunDetails } from "./route";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/core/clients/trpc";

export default function PipelineRunDetailsPageContent() {
  const params = routePipelineRunDetails.useParams();
  const pipelineRunWatch = usePipelineRunWatch();
  const pipelineRun = pipelineRunWatch.query.data;

  const tabs = useTabs();
  const { activeTab, handleChangeTab } = useTabsContext();

  const pipelineRunLogsQuery = useQuery({
    queryKey: ["pipelineRunLogs", params.name],
    queryFn: () => {
      return trpc.krakend.getPipelineRunLogs.query({
        clusterName: params.clusterName,
        namespace: params.namespace,
        name: params.name,
      });
    },
    enabled: pipelineRunWatch.isReady && !pipelineRun,
  });

  console.log(pipelineRunLogsQuery.data);

  const renderPageContent = React.useCallback(() => {
    const hasReserveLogs = false;

    if (pipelineRunWatch.query.error) {
      return (
        <Stack spacing={1}>
          <LoadingWrapper isLoading={false}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <TriangleAlert size={48} />
              <Stack spacing={1} direction="row" alignItems="center">
                <Typography component="span" fontSize={(t) => t.typography.pxToRem(14)} color="#596D80">
                  {hasReserveLogs ? (
                    "No pipeline runs were found for the requested resource. Logs have been retrieved from OpenSearch."
                  ) : (
                    <>
                      <p>
                        No logs were found for the requested pipeline run. This might have been caused by environment
                        cleanup. Please ensure you have checked the correct resource.
                      </p>
                      {/* {logs.error && logs.error?.message} */}
                    </>
                  )}
                </Typography>
              </Stack>
            </Stack>
            {/* {hasReserveLogs && <ReserveLogs />} */}
          </LoadingWrapper>
        </Stack>
      );
    }

    return (
      <LoadingWrapper isLoading={pipelineRunWatch.query.isLoading}>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [pipelineRunWatch.query.error, pipelineRunWatch.query.isLoading, tabs, activeTab, handleChangeTab]);

  const renderHeaderSlot = () => {
    if (!pipelineRunWatch.isReady || !pipelineRun) {
      return <></>;
    }

    const pullRequestLink = getPullRequestURL(pipelineRun!);

    return (
      <Stack direction="row" spacing={2} alignItems="center">
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
            to: routePipelineRunList.to,
            params: {
              clusterName: params.clusterName,
            },
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
          label: "PipelineRuns",
          route: {
            to: routePipelineRunList.to,
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
