import { ButtonGroup, Button, Tooltip } from "@mui/material";
import { Info } from "lucide-react";
import { checkHighlightedButtons } from "../../utils/checkHighlightedButtons";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import React from "react";
import { IMAGE_TAG_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { useWatchStageAppCodebasesCombinedData } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";

export const DeployedVersionConfigurationHeadColumn = () => {
  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();

  const { watch, setValue, resetField } = useTypedFormContext();
  const values = watch();
  const buttonsHighlighted = checkHighlightedButtons(values);

  const handleClickLatest = React.useCallback(() => {
    if (stageAppCodebasesCombinedDataWatch.isLoading || !stageAppCodebasesCombinedDataWatch.data) {
      return;
    }

    const stageAppCodebasesCombinedData = stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData;

    for (const { appCodebase } of stageAppCodebasesCombinedData) {
      const appName = appCodebase.metadata.name;
      const selectFieldName = `${appName}${IMAGE_TAG_POSTFIX}` as const;
      resetField(selectFieldName);

      const imageStreamBySelectedApplication =
        stageAppCodebasesCombinedDataWatch.data.stageAppCodebasesCombinedDataByApplicationName.get(
          appName
        )?.appCodebaseImageStream;

      if (!imageStreamBySelectedApplication || !imageStreamBySelectedApplication?.spec?.tags?.length) {
        continue;
      }

      const imageStreamTag = imageStreamBySelectedApplication.spec?.tags.at(-1)?.name;

      if (!imageStreamTag) {
        continue;
      }

      setValue(selectFieldName, `latest::${imageStreamTag}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [resetField, setValue, stageAppCodebasesCombinedDataWatch.data, stageAppCodebasesCombinedDataWatch.isLoading]);

  const handleClickStable = React.useCallback(() => {
    if (stageAppCodebasesCombinedDataWatch.isLoading || !stageAppCodebasesCombinedDataWatch.data) {
      return;
    }

    const stageAppCodebasesCombinedData = stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData;

    for (const { appCodebase } of stageAppCodebasesCombinedData) {
      const appName = appCodebase.metadata.name;
      const selectFieldName = `${appName}${IMAGE_TAG_POSTFIX}` as const;
      resetField(selectFieldName);

      const imageStreamBySelectedApplication =
        stageAppCodebasesCombinedDataWatch.data.stageAppCodebasesCombinedDataByApplicationName.get(
          appName
        )?.appCodebaseVerifiedImageStream;

      if (!imageStreamBySelectedApplication || !imageStreamBySelectedApplication?.spec?.tags?.length) {
        continue;
      }

      const imageStreamTag = imageStreamBySelectedApplication.spec?.tags.at(-1)?.name;

      if (!imageStreamTag) {
        continue;
      }

      setValue(selectFieldName, `stable::${imageStreamTag}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [resetField, setValue, stageAppCodebasesCombinedDataWatch.data, stageAppCodebasesCombinedDataWatch.isLoading]);

  return (
    <div className="flex flex-col gap-4">
      <ButtonGroup>
        <Tooltip title={"Set selected applications latest image stream version"}>
          <Button
            onClick={handleClickLatest}
            variant={buttonsHighlighted.latest ? "contained" : "outlined"}
            color={"primary"}
            size="small"
            fullWidth
          >
            latest
          </Button>
        </Tooltip>
        <Tooltip title={"Set selected applications stable image stream version"}>
          <Button
            onClick={handleClickStable}
            variant={buttonsHighlighted.stable ? "contained" : "outlined"}
            color={"primary"}
            size="small"
            fullWidth
          >
            stable
          </Button>
        </Tooltip>
      </ButtonGroup>
      <div className="flex flex-row flex-nowrap items-center gap-2">
        <div>Deployed version</div>
        <Tooltip
          title={
            <>
              <p className="text-sm">Choose the application image version to deploy.</p>
              <div className="text-sm">
                This field is enabled after a successful build and promotion through previous Environments, if any.
              </div>
            </>
          }
          sx={{ lineHeight: 1 }}
        >
          <Info size={16} />
        </Tooltip>
      </div>
    </div>
  );
};
