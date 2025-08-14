import { Stack, Tooltip } from "@mui/material";
import { CopyButton } from "@/core/components/CopyButton";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import {
  useStageWatch,
  useWatchStageAppCodebasesCombinedData,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import React from "react";

export const DeployedVersionHeadColumn = () => {
  const params = routeStageDetails.useParams();
  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();
  const stageWatch = useStageWatch();

  const stage = stageWatch.query.data!;

  const copyVersionsValue = React.useMemo(() => {
    if (
      stageAppCodebasesCombinedDataWatch.isLoading ||
      stageWatch.query.isLoading ||
      !stageAppCodebasesCombinedDataWatch.data
    ) {
      return "";
    }

    const copyTextVersions = stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData.reduce(
      (acc, cur) => {
        const name = cur.appCodebase.metadata.name;
        const deployedVersion = cur.application?.spec?.source?.targetRevision;

        return acc + `${name}:${deployedVersion}\n`;
      },
      ""
    );

    return `flow: ${params.cdPipeline}, env: ${stage.spec.name}, ns: ${
      stage.spec.namespace
    }\n\n${copyTextVersions} \n\n`;
  }, [
    params.cdPipeline,
    stage.spec.name,
    stage.spec.namespace,
    stageAppCodebasesCombinedDataWatch.data,
    stageAppCodebasesCombinedDataWatch.isLoading,
    stageWatch.query.isLoading,
  ]);

  return (
    <Stack spacing={1} alignItems="center" direction="row">
      Deployed Version
      <Tooltip title="Copy Environment Deployed Versions">
        <div>
          <CopyButton text={copyVersionsValue} size="small" />
        </div>
      </Tooltip>
    </Stack>
  );
};
