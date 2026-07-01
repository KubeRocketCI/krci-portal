import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { SelectOption } from "@/core/types/forms";
import { IMAGE_TAG_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { createImageStreamTags } from "../../utils/createImageStreamTags";
import { StageAppCodebaseCombinedData } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { getAppDeployedVersion } from "@/modules/platform/cdpipelines/pages/stage-details/utils/getAppDeployedVersion";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";

const CHANNEL = /^(latest|stable)::/;

/** Whether the selected value resolves to the same image as the running version. Strips one `latest::` / `stable::` prefix on each side, so picking [LATEST]/[STABLE] that resolves to the deployed tag counts as unchanged (no loose `includes` — that breaks semver-like tags, e.g. `…SNAPSHOT.10` vs `…SNAPSHOT.1`). */
function sameImageTag(selected: string, reference: string): boolean {
  if (reference === "") return selected === "";
  if (selected === "") return false;
  if (selected === reference) return true;
  const a = selected.replace(CHANNEL, "");
  const b = reference.replace(CHANNEL, "");
  return a === b;
}

export const DeployedVersionConfigurationColumn = ({
  stageAppCodebasesCombinedData,
}: {
  stageAppCodebasesCombinedData: StageAppCodebaseCombinedData;
}) => {
  const { appCodebaseImageStream, appCodebaseVerifiedImageStream, appCodebase, application } =
    stageAppCodebasesCombinedData;

  const form = useTypedFormContext();
  const fieldName = `${appCodebase.metadata.name}${IMAGE_TAG_POSTFIX}` as const;

  const imageTagFromFormValues = useStore(
    form.store,
    (s) => (s.values as Record<string, unknown>)[fieldName] as string | undefined
  );

  // Render options when EITHER stream is available. The input stream supplies the deployable
  // tags ([LATEST] + history); the current stage's own verified stream only adds the optional
  // [STABLE] entry. Requiring both (the previous behaviour) blanked the whole dropdown whenever
  // the stage's own verified stream was missing, even though deployable tags were available.
  const imageStreamTagsOptions: SelectOption<string>[] = React.useMemo(
    () =>
      appCodebaseImageStream || appCodebaseVerifiedImageStream
        ? createImageStreamTags(appCodebaseImageStream, appCodebaseVerifiedImageStream)
        : [],
    [appCodebaseImageStream, appCodebaseVerifiedImageStream]
  );

  const imageTagsLength = imageStreamTagsOptions.length;

  // Persistent caption above the selector, so the running version stays visible after a new one is
  // picked (a Select placeholder would be hidden on selection).
  const deployedVersion = getAppDeployedVersion(appCodebase, application);
  const hasDeployedVersion = Boolean(application) && !!deployedVersion && deployedVersion !== "NaN";
  const deployedVersionCaption = hasDeployedVersion ? `Running version: ${deployedVersion}` : "Not deployed";

  // Compare the selection against the live running version so the change indicator lights up only on
  // a real change. "" = nothing running yet, so any concrete selection then counts as a change.
  const runningRef = hasDeployedVersion ? deployedVersion : "";

  const placeholder = imageTagsLength ? "Select image tag" : "No image tags available";

  const hasImageTags = imageTagsLength > 0;
  const helperText = hasImageTags ? "" : "Run at least one build pipeline to produce the necessary artifacts.";

  return (
    <form.Field name={fieldName}>
      {(field) => {
        const raw = field.state.value as string | undefined;
        const selected = raw !== undefined && raw !== null ? String(raw) : String(imageTagFromFormValues ?? "");

        // Nothing picked yet is not a change; otherwise compare the resolved tag to the running version.
        const unchanged = selected === "" || sameImageTag(selected, runningRef);

        return (
          <div className="flex w-full flex-row items-stretch gap-2">
            <div
              className={cn(
                "w-1 shrink-0 rounded-sm",
                !imageTagsLength && "bg-destructive",
                Boolean(imageTagsLength) && unchanged && "bg-muted-foreground/35",
                Boolean(imageTagsLength) && !unchanged && "bg-primary"
              )}
              aria-hidden
            />
            <div className="flex grow flex-col gap-0.5">
              <span className="text-muted-foreground truncate text-xs leading-none" title={deployedVersionCaption}>
                {deployedVersionCaption}
              </span>
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
                    queueMicrotask(() => field.handleBlur());
                  }}
                  disabled={!imageStreamTagsOptions.length}
                >
                  <SelectTrigger className="text-start">
                    <SelectValue placeholder={placeholder} />
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
