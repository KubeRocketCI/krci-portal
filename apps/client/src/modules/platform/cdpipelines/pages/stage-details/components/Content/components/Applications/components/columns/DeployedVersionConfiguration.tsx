import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { SelectOption } from "@/core/providers/Form/types";
import { IMAGE_TAG_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import React from "react";
import { useFormContext } from "react-hook-form";
import { createImageStreamTags } from "../../utils/createImageStreamTags";
import { StageAppCodebaseCombinedData } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";

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
    <div className="flex w-full flex-row gap-2">
      <div
        style={{
          flexShrink: 0,
          width: "4px",
          backgroundColor: !imageTagsLength
            ? "var(--error-main)"
            : isSameAsDefaultValue
              ? "var(--action-disabled)"
              : "var(--primary-main)",
          borderRadius: "1px",
        }}
      />
      <div className="grow">
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
      </div>
    </div>
  );
};
