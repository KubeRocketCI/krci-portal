import { SelectField } from "@/core/components/form/SelectField";
import { SelectOption } from "@/core/providers/Form/types";
import { IMAGE_TAG_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import React from "react";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { createImageStreamTags } from "../../utils/createImageStreamTags";
import { StageAppCodebaseCombinedData } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";

export const DeployedVersionConfigurationColumn = ({
  stageAppCodebasesCombinedData,
}: {
  stageAppCodebasesCombinedData: StageAppCodebaseCombinedData;
}) => {
  const { appCodebaseImageStream, appCodebaseVerifiedImageStream, appCodebase } = stageAppCodebasesCombinedData;

  const form = useTypedFormContext();
  const fieldName = `${appCodebase.metadata.name}${IMAGE_TAG_POSTFIX}` as const;

  const imageStreamTagsOptions: SelectOption[] = React.useMemo(
    () =>
      appCodebaseImageStream && appCodebaseVerifiedImageStream
        ? createImageStreamTags(appCodebaseImageStream, appCodebaseVerifiedImageStream)
        : [],
    [appCodebaseImageStream, appCodebaseVerifiedImageStream]
  );

  const currentDefaultValue = form.options.defaultValues?.[fieldName];
  const imageTagsLength = imageStreamTagsOptions.length;

  const label = currentDefaultValue
    ? `Running version: ${currentDefaultValue}`
    : imageTagsLength
      ? "Select image tag"
      : "No image tags available";

  return (
    <form.Field name={fieldName}>
      {(field) => {
        const currentValue = field.state.value || currentDefaultValue;
        const isSameAsDefaultValue =
          currentValue && currentDefaultValue ? currentValue.includes(currentDefaultValue) : false;

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
              <SelectField
                field={field}
                label={label}
                options={imageStreamTagsOptions}
                disabled={!imageStreamTagsOptions.length}
                helperText={
                  imageStreamTagsOptions.length
                    ? ""
                    : "Run at least one build pipeline to produce the necessary artifacts."
                }
              />
            </div>
          </div>
        );
      }}
    </form.Field>
  );
};
