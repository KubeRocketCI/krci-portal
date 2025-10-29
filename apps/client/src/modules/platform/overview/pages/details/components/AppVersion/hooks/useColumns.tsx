import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { Tooltip } from "@mui/material";
import { Application, applicationLabels } from "@my-project/shared";
import { Link, useParams } from "@tanstack/react-router";
import React from "react";
import { routeOverviewDetails } from "../../../route";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";

export const useColumns = (): TableColumn<Application>[] => {
  const { clusterName, namespace } = useParams({ from: routeOverviewDetails.fullPath });

  return React.useMemo(
    () => [
      {
        id: "deploymentFlow",
        label: (
          <>
            <Tooltip title="The Deployment Flow used to deploy this version.">
              <div>Deployment Flow</div>
            </Tooltip>
          </>
        ),
        data: {
          render: ({ data: { metadata } }) => {
            const CDPipelineName = metadata?.labels?.[applicationLabels.pipeline];

            return (
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
            );
          },
        },
        cell: {
          customizable: false,
          width: 30,
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
              <Link
                to={routeStageDetails.fullPath}
                params={{
                  clusterName,
                  CDPipelineName: CDPipelineName!,
                  stageName: stageName!,
                  namespace,
                }}
              >
                <TextWithTooltip text={stageName || ""} />
              </Link>
            );
          },
        },
        cell: {
          customizable: false,
          width: 25,
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
                  <Tooltip title="No deployment." followCursor>
                    <div>—</div>
                  </Tooltip>
                </div>
              );
            }

            return <TextWithTooltip text={data?.spec.source?.targetRevision ?? "Unknown"} />;
          },
        },
        cell: {
          customizable: false,
          width: 45,
          baseWidth: 45,
          isFixed: true,
        },
      },
    ],
    [clusterName, namespace]
  );
};
