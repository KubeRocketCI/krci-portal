import { EmptyList } from "@/core/components/EmptyList";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { cn } from "@/core/utils/classname";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import {
  Codebase,
  codebaseLabels,
  codebaseType,
  codebaseBranchLabels,
  sortKubeObjectByCreationTimestamp,
} from "@my-project/shared";
import { AlertCircle, GitBranch, Package, X, Check } from "lucide-react";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { CREATE_CDPIPELINE_FORM_NAMES, ApplicationFieldArrayItem } from "../../types";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch/hooks";
import { useCreateCDPipelineFormContext } from "../../providers/form/hooks";
import { CommandItem } from "@/core/components/ui/command";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";

interface ApplicationCardProps {
  application: Codebase;
  index: number;
  onRemove: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, index, onRemove }) => {
  const form = useCreateCDPipelineFormContext();
  const appName = application.metadata.name;

  const applicationBranchListWatch = useCodebaseBranchWatchList({
    labels: {
      [codebaseBranchLabels.codebase]: application.metadata.name,
    },
  });

  const sortedApplicationBranchList = React.useMemo(() => {
    if (!applicationBranchListWatch.data.array) return [];
    return [...applicationBranchListWatch.data.array].sort(sortKubeObjectByCreationTimestamp);
  }, [applicationBranchListWatch.data.array]);

  const fieldArrayValue = useStore(
    form.store,
    (state) => state.values[CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name] || []
  );

  const currentField = fieldArrayValue[index];
  const rowAppBranchFieldValue = currentField?.appBranch || "";

  // Subscribe to field errors
  const fieldErrors = useStore(form.store, (state) => state.fieldMeta);
  const appBranchError = React.useMemo(() => {
    const fieldArrayMeta = fieldErrors[CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name];
    if (!fieldArrayMeta || !fieldArrayMeta.errorMap) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const indexErrors = (fieldArrayMeta.errorMap as any)[index];
    if (!indexErrors) return undefined;
    return indexErrors.appBranch?.[0];
  }, [fieldErrors, index]);

  const hasValidationError = !!appBranchError;

  const branchOptions = sortedApplicationBranchList.map((el) => ({
    label: el.spec.branchName,
    value: el.metadata.name,
    branchName: el.spec.branchName,
  }));

  // Track if we've initialized the default value to prevent re-setting
  const hasInitializedRef = React.useRef(false);

  // Auto-select default branch when branches are loaded
  React.useEffect(() => {
    if (
      !hasInitializedRef.current &&
      !applicationBranchListWatch.query.isLoading &&
      sortedApplicationBranchList.length > 0 &&
      !rowAppBranchFieldValue
    ) {
      // Find the default branch or use the first available branch
      const defaultBranch = sortedApplicationBranchList.find(
        (branch) => branch.spec.branchName === application.spec.defaultBranch
      );
      const branchToSelect = defaultBranch || sortedApplicationBranchList[0];

      if (branchToSelect) {
        const currentFieldArray = form.getFieldValue(CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name) || [];
        const updatedFieldArray = [...currentFieldArray];
        updatedFieldArray[index] = {
          ...updatedFieldArray[index],
          appBranch: branchToSelect.metadata.name,
        };
        form.setFieldValue(CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name, updatedFieldArray);

        // Also update inputDockerStreams
        const currentInputDockerStreams =
          form.getFieldValue(CREATE_CDPIPELINE_FORM_NAMES.inputDockerStreams.name) || [];
        if (!currentInputDockerStreams.includes(branchToSelect.metadata.name)) {
          form.setFieldValue(CREATE_CDPIPELINE_FORM_NAMES.inputDockerStreams.name, [
            ...currentInputDockerStreams,
            branchToSelect.metadata.name,
          ]);
        }

        hasInitializedRef.current = true;
      }
    }
  }, [
    applicationBranchListWatch.query.isLoading,
    sortedApplicationBranchList,
    rowAppBranchFieldValue,
    application.spec.defaultBranch,
    form,
    index,
  ]);

  const handleBranchChange = React.useCallback(
    (value: string) => {
      const currentFieldArray = form.getFieldValue(CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name) || [];
      const updatedFieldArray = [...currentFieldArray];
      updatedFieldArray[index] = {
        ...updatedFieldArray[index],
        appBranch: value,
      };
      form.setFieldValue(CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name, updatedFieldArray);

      const currentInputDockerStreamsValue =
        form.getFieldValue(CREATE_CDPIPELINE_FORM_NAMES.inputDockerStreams.name) || [];
      const newInputDockerStreamsValue = [
        ...currentInputDockerStreamsValue.filter((el: string) => el !== rowAppBranchFieldValue),
        value,
      ] as string[];
      form.setFieldValue(CREATE_CDPIPELINE_FORM_NAMES.inputDockerStreams.name, newInputDockerStreamsValue);
    },
    [form, index, rowAppBranchFieldValue]
  );

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
          onClick={onRemove}
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
            {application.spec.description && (
              <p className="text-muted-foreground line-clamp-3 text-xs">{application.spec.description}</p>
            )}
          </div>

          <div className="mt-4 border-t pt-2">
            <Label htmlFor={`branch-select-grid-${index}`} className="mb-2 flex items-center gap-1.5 text-xs">
              <GitBranch className="h-3 w-3" />
              Branch
              {hasValidationError && <span className="text-destructive">*</span>}
            </Label>
            <Select value={rowAppBranchFieldValue || ""} onValueChange={handleBranchChange}>
              <SelectTrigger
                id={`branch-select-grid-${index}`}
                className={cn("h-9 text-xs", hasValidationError && "border-destructive focus:ring-destructive")}
              >
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent className="fixed z-50">
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.value} value={branch.value}>
                    <div className="flex items-center gap-2">
                      <GitBranch className="text-muted-foreground h-3 w-3" />
                      <span className="text-xs">{branch.branchName}</span>
                      {branch.branchName === application.spec.defaultBranch && (
                        <Badge variant="outline" className="text-xs">
                          default
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasValidationError && (
              <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs">
                <AlertCircle className="h-3 w-3" />
                {appBranchError}
              </p>
            )}
          </div>
        </div>
      </Card>
    </LoadingWrapper>
  );
};

/**
 * Refactored Applications component using enhanced FormCombobox
 * This properly integrates with TanStack Form validation
 */
export const Applications: React.FC = () => {
  const form = useCreateCDPipelineFormContext();

  const applicationListWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.application,
    },
  });

  const applications = React.useMemo(() => applicationListWatch.data.array, [applicationListWatch.data.array]) as
    | Codebase[]
    | undefined;

  // Map applications to options for FormCombobox
  const applicationOptions = React.useMemo(() => {
    if (!applications) return [];
    return applications.map((app) => ({
      value: app.metadata.name,
      label: app.metadata.name,
    }));
  }, [applications]);

  const fieldArrayValue = useStore(
    form.store,
    (state) =>
      (state.values[CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name] || []) as ApplicationFieldArrayItem[]
  );

  // Sync applications field array when selection changes
  const handleApplicationsChange = React.useCallback(
    (selectedApps: string[]) => {
      const currentFieldArray = fieldArrayValue || [];

      // Add new applications with default branch auto-selection
      const newFieldArray = selectedApps.map((appName) => {
        const existing = currentFieldArray.find((app) => app.appName === appName);

        // If application already exists, keep its data
        if (existing) {
          return existing;
        }

        // For new applications, set appBranch to empty string
        // ApplicationCard will auto-select the default branch on mount via useEffect
        return { appName, appBranch: "", appToPromote: false };
      });

      form.setFieldValue(CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name, newFieldArray);

      // Update applicationsToPromote
      const applicationsToPromoteAllFieldValue =
        form.getFieldValue(CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsToPromoteAll.name) || false;
      form.setFieldValue(
        CREATE_CDPIPELINE_FORM_NAMES.applicationsToPromote.name,
        applicationsToPromoteAllFieldValue ? selectedApps : []
      );
    },
    [form, fieldArrayValue]
  );

  return (
    <LoadingWrapper isLoading={applicationListWatch.query.isLoading}>
      <div className="space-y-6">
        {/* Use enhanced FormCombobox with custom rendering */}
        <form.AppField
          name={CREATE_CDPIPELINE_FORM_NAMES.applications.name}
          listeners={{
            onChange: ({ value }) => handleApplicationsChange(value),
          }}
        >
          {(field) => (
            <field.FormCombobox
              label="Applications"
              placeholder="Select applications..."
              options={applicationOptions}
              multiple
              searchPlaceholder="Search applications..."
              emptyText="No applications found."
              loading={applicationListWatch.query.isLoading}
              data={{ applications, form }}
              renderChip={({ value, onRemove }) => (
                <Badge key={value} className="shrink-0 gap-1.5 pr-1 pl-2">
                  {value}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="hover:bg-input hover:text-foreground ml-1 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              renderOption={({ option, selected, onSelect }) => {
                const app = applications?.find((a) => a.metadata.name === option.value);
                if (!app) return null;

                return (
                  <CommandItem key={option.value} value={option.value} onSelect={onSelect} className="py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Package className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <span className="text-foreground shrink-0 text-sm font-medium">{app.metadata.name}</span>
                      {/* Compact language and framework icons */}
                      {(app.spec.lang || app.spec.framework) && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          {app.spec.lang && (
                            <UseSpriteSymbol
                              name={app.spec.lang}
                              width={14}
                              height={14}
                              className="text-muted-foreground/70"
                            />
                          )}
                          {app.spec.framework && (
                            <UseSpriteSymbol
                              name={app.spec.framework}
                              width={14}
                              height={14}
                              className="text-muted-foreground/70"
                            />
                          )}
                        </div>
                      )}
                      {app.spec.description && (
                        <span className="text-muted-foreground truncate text-xs">{app.spec.description}</span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        selected ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {selected && <Check className="text-primary-foreground h-3 w-3" />}
                    </div>
                  </CommandItem>
                );
              }}
              renderSelectedContent={({ selectedValues, data }) => {
                if (!selectedValues.length) {
                  return (
                    <EmptyList
                      customText="No applications selected"
                      description="Select applications from the dropdown above to configure their deployment branches."
                      icon={<Package className="text-muted-foreground" size={48} />}
                    />
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {selectedValues.map((appName, index) => {
                      const application = data.applications?.find((el) => el.metadata.name === appName);
                      if (!application) return null;

                      return (
                        <ApplicationCard
                          key={appName}
                          application={application}
                          index={index}
                          onRemove={() => {
                            const newValue = selectedValues.filter((v) => v !== appName);
                            field.handleChange(newValue);
                          }}
                        />
                      );
                    })}
                  </div>
                );
              }}
            />
          )}
        </form.AppField>

        {/* Hidden fields to sync related data */}
        <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray.name}>{() => null}</form.AppField>
        <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.inputDockerStreams.name}>{() => null}</form.AppField>
      </div>
    </LoadingWrapper>
  );
};
