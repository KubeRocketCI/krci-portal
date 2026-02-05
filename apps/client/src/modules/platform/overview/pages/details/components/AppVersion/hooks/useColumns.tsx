import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Application, applicationLabels } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import React from "react";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { Button } from "@/core/components/ui/button";
import { routeOverviewDetails } from "../../../route";

export const useColumns = (): TableColumn<Application>[] => {
  const { clusterName, namespace } = routeOverviewDetails.useParams();

  return React.useMemo(
    () => [
      {
        id: "deploymentFlow",
        label: (
          <>
            <Tooltip title="The Deployment used to deploy this version.">
              <div>Deployment</div>
            </Tooltip>
          </>
        ),
        data: {
          render: ({ data: { metadata } }) => {
            const CDPipelineName = metadata?.labels?.[applicationLabels.pipeline];

            return (
              <Button variant="link" asChild size="sm">
                <Link
                  to={routeCDPipelineDetails.fullPath}
                  params={{
                    clusterName,
                    name: CDPipelineName!,
                    namespace,
                  }}
                >
                  <TextWithTooltip text={CDPipelineName || ""} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 30,
          isFixed: true,
        },
      },
      {
        id: "environment",
        label: (
          <>
            <Tooltip title="The environment where this version is deployed.">
              <div>Environment</div>
            </Tooltip>
          </>
        ),
        data: {
          render: ({ data: { metadata } }) => {
            const CDPipelineName = metadata?.labels?.[applicationLabels.pipeline];
            const stageName = metadata?.labels?.[applicationLabels.stage];

            return (
              <Button variant="link" asChild>
                <Link
                  to={routeStageDetails.fullPath}
                  params={{
                    clusterName,
                    cdPipeline: CDPipelineName!,
                    stage: stageName!,
                    namespace,
                  }}
                >
                  <TextWithTooltip text={stageName || ""} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 25,
          isFixed: true,
        },
      },
      {
        id: "version",
        label: "Deployed Version",
        data: {
          render: ({ data }) => {
            if (data?.spec.source?.targetRevision === "build/NaN") {
              return (
                <div className="grow">
                  <Tooltip title="No deployment.">
                    <div>—</div>
                  </Tooltip>
                </div>
              );
            }

            return <TextWithTooltip text={data?.spec.source?.targetRevision ?? "Unknown"} />;
          },
        },
        cell: {
          baseWidth: 45,
          isFixed: true,
        },
      },
    ],
    [clusterName, namespace]
  );
};
