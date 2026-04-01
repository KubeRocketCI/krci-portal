import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import React from "react";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch/hooks";
import { codebaseBranchLabels, sortCodebaseBranchesWithDefaultFirst } from "@my-project/shared";
import { X, Package, GitBranch, AlertCircle } from "lucide-react";
import { buildBranchOptions } from "@/modules/platform/cdpipelines/utils/buildBranchOptions";
import { resolveApplicationBranch } from "../../../../utils/resolveApplicationBranch";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Codebase } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { useStore } from "@tanstack/react-form";
import { useEditCDPipelineForm } from "../../../../providers/form/hooks";
import { useEditCDPipelineData } from "../../../../providers/data/hooks";
import { EDIT_CDPIPELINE_FORM_NAMES, type EditCDPipelineFormValues } from "../../../../types";

interface ApplicationRowProps {
  application: Codebase;
  index: number;
  removeRow: () => void;
}

export const ApplicationRow = ({ application, index, removeRow }: ApplicationRowProps) => {
  const appName = application.metadata.name;
  const {
    spec: { description, defaultBranch },
  } = application;

  const form = useEditCDPipelineForm();
  const { cdPipeline } = useEditCDPipelineData();

  const fieldArray = useStore(
    form.store,
    (state: { values: EditCDPipelineFormValues }) => state.values.ui_applicationsFieldArray || []
  );
  const currentFieldValue = fieldArray[index];
  const appBranchValue = currentFieldValue?.appBranch || "";

  const applicationBranchListWatch = useCodebaseBranchWatchList({
    labels: {
      [codebaseBranchLabels.codebase]: application.metadata.name,
    },
  });

  const sortedApplicationBranchList = React.useMemo(() => {
    if (!applicationBranchListWatch.data.array) return [];
    return sortCodebaseBranchesWithDefaultFirst(applicationBranchListWatch.data.array, defaultBranch);
  }, [applicationBranchListWatch.data.array, defaultBranch]);

  const updateAppBranch = React.useCallback(
    (newBranchValue: string) => {
      const currentArray = structuredClone(form.store.state.values.ui_applicationsFieldArray || []);
      if (currentArray[index]) {
        currentArray[index].appBranch = newBranchValue;
        form.setFieldValue("ui_applicationsFieldArray", currentArray);

        const newInputDockerStreams = structuredClone(form.store.state.values.inputDockerStreams || []);
        newInputDockerStreams[index] = newBranchValue;
        form.setFieldValue("inputDockerStreams", newInputDockerStreams);
      }
    },
    [form, index]
  );

  const hasInitializedRef = React.useRef(false);

  React.useEffect(() => {
    hasInitializedRef.current = false;
  }, [appName]);

  // Resolve branch value once when branches are loaded.
  // The CDPipeline spec may have a malformed inputDockerStreams array (wrong index
  // alignment, duplicates, length mismatch). Instead of trusting the index, we check
  // whether the stored value actually belongs to this application's branch list.
  // If not, we search ALL inputDockerStreams entries for one that does — mirroring
  // the label-based lookup the cd-pipeline-operator uses. Saving the form will
  // produce a correctly-aligned spec, healing the malformed resource.
  React.useEffect(() => {
    if (hasInitializedRef.current || sortedApplicationBranchList.length === 0) {
      return;
    }

    const currentBranch = form.store.state.values.ui_applicationsFieldArray?.[index]?.appBranch ?? "";
    const branchNames = new Set(sortedApplicationBranchList.map((el) => el.metadata.name));
    const originalStreams = cdPipeline?.spec.inputDockerStreams || [];
    const fallbackBranch = sortedApplicationBranchList[0]?.metadata.name;

    const resolved = resolveApplicationBranch(currentBranch, branchNames, originalStreams, fallbackBranch);

    if (resolved && resolved !== currentBranch) {
      updateAppBranch(resolved);
    }

    hasInitializedRef.current = true;
  }, [sortedApplicationBranchList, updateAppBranch, form, index, cdPipeline]);

  const appBranchFieldMeta = form.getFieldMeta(`ui_applicationsFieldArray[${index}].appBranch`);
  const appBranchError = appBranchFieldMeta?.errors?.length ? String(appBranchFieldMeta.errors[0]) : undefined;
  const hasValidationError = !!appBranchError;

  const branchOptions = React.useMemo(
    () => buildBranchOptions(sortedApplicationBranchList, defaultBranch),
    [sortedApplicationBranchList, defaultBranch]
  );

  const { originalBranchValue, isNewApplication } = React.useMemo(() => {
    if (!cdPipeline) return { originalBranchValue: "", isNewApplication: true };
    const appIndex = cdPipeline.spec.applications?.indexOf(appName) ?? -1;
    if (appIndex === -1) return { originalBranchValue: "", isNewApplication: true };
    return {
      originalBranchValue: cdPipeline.spec.inputDockerStreams?.[appIndex] ?? "",
      isNewApplication: false,
    };
  }, [cdPipeline, appName]);

  const branchHasChanged = !isNewApplication && appBranchValue !== originalBranchValue;

  return (
    <LoadingWrapper isLoading={applicationBranchListWatch.query.isLoading}>
      <Card
        className={cn(
          "relative flex flex-col p-5 transition-all",
          hasValidationError && "border-primary/50 bg-primary/5 dark:bg-primary/10"
        )}
      >
        {hasValidationError && (
          <div className="border-primary/30 bg-primary/10 text-primary dark:bg-primary/20 absolute top-0 right-0 left-0 flex items-center gap-2 rounded-t-lg border-b px-3 py-1.5">
            <AlertCircle className="text-primary h-3.5 w-3.5" />
            <span className="text-xs">Branch required</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={removeRow}
          className={cn(
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute right-3 h-7 w-7 p-0",
            hasValidationError ? "top-10" : "top-3"
          )}
        >
          <X className="h-3.5 w-3.5" />
        </Button>

        <div className={cn("flex h-full flex-col gap-2", hasValidationError && "mt-6")}>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Package className="text-primary h-4 w-4 shrink-0" />
              <h4 className="text-foreground text-sm font-medium">{appName}</h4>
            </div>
            {description && <p className="text-muted-foreground line-clamp-3 text-xs">{description}</p>}
          </div>

          <div className="mt-4 border-t pt-2">
            <form.AppField
              name={`${EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray}[${index}].appBranch` as never}
              listeners={{
                onChange: ({ value }) => {
                  const v = typeof value === "string" ? value : "";
                  if (!v) return;
                  const next = structuredClone(form.getFieldValue(EDIT_CDPIPELINE_FORM_NAMES.inputDockerStreams) ?? []);
                  while (next.length <= index) next.push("");
                  next[index] = v;
                  form.setFieldValue(EDIT_CDPIPELINE_FORM_NAMES.inputDockerStreams, next);
                },
              }}
            >
              {(f) => (
                <div className="flex w-full flex-row items-stretch gap-2">
                  <div
                    className={cn(
                      "w-1 shrink-0 rounded-sm",
                      isNewApplication && "bg-primary",
                      !isNewApplication && !branchHasChanged && "bg-muted-foreground/35",
                      !isNewApplication && branchHasChanged && "bg-primary"
                    )}
                    aria-hidden
                  />
                  <div className="grow">
                    <f.FormCombobox
                      label={
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                          <GitBranch className="h-3 w-3" />
                          Branch
                          {hasValidationError && <span className="text-destructive">*</span>}
                        </span>
                      }
                      options={branchOptions}
                      placeholder="Select branch"
                      searchPlaceholder="Search branches..."
                      emptyText="No branches found"
                      skipEmptySingleSelection
                      displayError={appBranchError}
                    />
                  </div>
                </div>
              )}
            </form.AppField>
          </div>
        </div>
      </Card>
    </LoadingWrapper>
  );
};
