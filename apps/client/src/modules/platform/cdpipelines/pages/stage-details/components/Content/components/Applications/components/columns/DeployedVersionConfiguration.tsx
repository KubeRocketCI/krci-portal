import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { SelectOption } from "@/core/providers/Form/types";
import { IMAGE_TAG_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import { Box, Stack } from "@mui/material";
import React from "react";
import { useFormContext } from "react-hook-form";
import { createImageStreamTags } from "../../utils/createImageStreamTags";
import { StageAppCodebaseCombinedData } from "@/k8s/api/groups/KRCI/Stage/hooks/useWatchStageAppCodebasesCombinedData";

export const DeployedVersionConfigurationColumn = ({
  stageAppCodebasesCombinedData,
}: {
  stageAppCodebasesCombinedData: StageAppCodebaseCombinedData;
}) => {
  const { appCodebaseImageStream, appCodebaseVerifiedImageStream, appCodebase } = stageAppCodebasesCombinedData;

  const {
    control,
    formState: { errors, defaultValues },
    register,
    watch,
  } = useFormContext();

  const imageStreamTagsOptions: SelectOption[] = React.useMemo(
    () =>
      appCodebaseImageStream && appCodebaseVerifiedImageStream
        ? createImageStreamTags(appCodebaseImageStream, appCodebaseVerifiedImageStream)
        : [],
    [appCodebaseImageStream, appCodebaseVerifiedImageStream]
  );

  const currentDefaultValue = defaultValues?.[`${appCodebase?.metadata.name}${IMAGE_TAG_POSTFIX}`];
  const currentValue = watch(`${appCodebase.metadata.name}${IMAGE_TAG_POSTFIX}`, currentDefaultValue);

  const imageTagsLength = imageStreamTagsOptions.length;

  const label = React.useMemo(() => {
    if (currentDefaultValue) {
      return `Running version: ${currentDefaultValue}`;
    }

    if (imageTagsLength) {
      return "Select image tag";
    }

    return "No image tags available";
  }, [currentDefaultValue, imageTagsLength]);

  const isSameAsDefaultValue = currentValue?.includes(currentDefaultValue);

  return (
    <Stack direction="row" spacing={1} width="100%">
      <Box
        sx={{
          flexShrink: 0,
          width: "4px",
          backgroundColor: (t) =>
            !imageTagsLength
              ? t.palette.error.main
              : isSameAsDefaultValue
                ? t.palette.action.disabled
                : t.palette.primary.main,
          borderRadius: "1px",
        }}
      />
      <Box flexGrow={1}>
        <FormSelect
          {...register(`${appCodebase.metadata.name}${IMAGE_TAG_POSTFIX}`, {
            required: "Select image tag",
          })}
          label={label}
          control={control}
          errors={errors}
          options={imageStreamTagsOptions}
          disabled={!imageStreamTagsOptions.length}
          helperText={
            imageStreamTagsOptions.length ? "" : "Run at least one build pipeline to produce the necessary artifacts."
          }
        />
      </Box>
    </Stack>
  );
};
