import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { SelectOption } from "@/core/types/forms";
import { IMAGE_TAG_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import React from "react";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { createImageStreamTags } from "../../utils/createImageStreamTags";
import { StageAppCodebaseCombinedData } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Tooltip } from "@/core/components/ui/tooltip";

export const DeployedVersionConfigurationColumn = ({
  stageAppCodebasesCombinedData,
}: {
  stageAppCodebasesCombinedData: StageAppCodebaseCombinedData;
}) => {
  const { appCodebaseImageStream, appCodebaseVerifiedImageStream, appCodebase } = stageAppCodebasesCombinedData;

  const form = useTypedFormContext();
  const fieldName = `${appCodebase.metadata.name}${IMAGE_TAG_POSTFIX}` as const;

  const imageStreamTagsOptions: SelectOption<string>[] = React.useMemo(
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

  const hasImageTags = imageTagsLength > 0;
  const helperText = hasImageTags ? "" : "Run at least one build pipeline to produce the necessary artifacts.";

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
              <ConditionalWrapper
                condition={!hasImageTags}
                wrapper={(children) => (
                  <Tooltip title={helperText}>
                    <div>{children}</div>
                  </Tooltip>
                )}
              >
                <Select
                  value={(field.state.value ?? "") as string}
                  onValueChange={(value) => {
                    field.handleChange(value as never);
                    setTimeout(() => field.handleBlur(), 0);
                  }}
                  disabled={!imageStreamTagsOptions.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={label} />
                  </SelectTrigger>
                  <SelectContent>
                    {imageStreamTagsOptions.map(({ label: optionLabel, value }) => (
                      <SelectItem key={value} value={value}>
                        {optionLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ConditionalWrapper>
            </div>
          </div>
        );
      }}
    </form.Field>
  );
};
