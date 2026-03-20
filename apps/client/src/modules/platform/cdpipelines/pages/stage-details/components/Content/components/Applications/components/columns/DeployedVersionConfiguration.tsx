import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { SelectOption } from "@/core/types/forms";
import { IMAGE_TAG_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { createImageStreamTags } from "../../utils/createImageStreamTags";
import { StageAppCodebaseCombinedData } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";

const CHANNEL = /^(latest|stable)::/;

/** Compare select value to deployed/default tag. Strips one `latest::` / `stable::` prefix on each side (no loose `includes` — that breaks semver-like tags, e.g. `…SNAPSHOT.10` vs `…SNAPSHOT.1`). */
function sameImageTag(selected: string, reference: string): boolean {
  if (reference === "") return selected === "";
  if (selected === "") return false;
  if (selected === reference) return true;
  const a = selected.replace(CHANNEL, "");
  const b = reference.replace(CHANNEL, "");
  return a === b;
}

/** String from `defaultValues` when the key exists and the value is set; otherwise `null`. */
function getDefaultValueForField(defaults: Record<string, unknown> | undefined, field: string): string | null {
  if (defaults == null || !Object.hasOwn(defaults, field)) return null;
  const v = defaults[field];
  if (v === undefined || v === null) return null;
  return String(v);
}

export const DeployedVersionConfigurationColumn = ({
  stageAppCodebasesCombinedData,
}: {
  stageAppCodebasesCombinedData: StageAppCodebaseCombinedData;
}) => {
  const { appCodebaseImageStream, appCodebaseVerifiedImageStream, appCodebase } = stageAppCodebasesCombinedData;

  const form = useTypedFormContext();
  const fieldName = `${appCodebase.metadata.name}${IMAGE_TAG_POSTFIX}` as const;

  const imageTagFromFormValues = useStore(
    form.store,
    (s) => (s.values as Record<string, unknown>)[fieldName] as string | undefined
  );

  const imageStreamTagsOptions: SelectOption<string>[] = React.useMemo(
    () =>
      appCodebaseImageStream && appCodebaseVerifiedImageStream
        ? createImageStreamTags(appCodebaseImageStream, appCodebaseVerifiedImageStream)
        : [],
    [appCodebaseImageStream, appCodebaseVerifiedImageStream]
  );

  const deployedFromDefaults = getDefaultValueForField(
    form.options.defaultValues as Record<string, unknown> | undefined,
    fieldName
  );

  const imageTagsLength = imageStreamTagsOptions.length;

  const runningLabel =
    deployedFromDefaults !== null
      ? deployedFromDefaults || undefined
      : typeof imageTagFromFormValues === "string"
        ? imageTagFromFormValues || undefined
        : undefined;

  const label = runningLabel
    ? `Running version: ${runningLabel}`
    : imageTagsLength
      ? "Select image tag"
      : "No image tags available";

  const hasImageTags = imageTagsLength > 0;
  const helperText = hasImageTags ? "" : "Run at least one build pipeline to produce the necessary artifacts.";

  return (
    <form.Field name={fieldName}>
      {(field) => {
        const raw = field.state.value as string | undefined;
        const selected = raw !== undefined && raw !== null ? String(raw) : String(imageTagFromFormValues ?? "");

        // `isDirty` stays true after edits even if the user picks the original tag again; `isDefaultValue` is still
        // true when the value matches `form.options.defaultValues` for this field (TanStack deep check).
        const matchesDefaultMeta = field.state.meta.isDefaultValue;
        const unchanged =
          deployedFromDefaults !== null
            ? sameImageTag(selected, deployedFromDefaults) || matchesDefaultMeta
            : !field.state.meta.isDirty || matchesDefaultMeta;

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
                    queueMicrotask(() => field.handleBlur());
                  }}
                  disabled={!imageStreamTagsOptions.length}
                >
                  <SelectTrigger className="text-start">
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
