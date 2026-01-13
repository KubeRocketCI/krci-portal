import { EmptyList } from "@/core/components/EmptyList";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command";
import { FormFieldGroup } from "@/core/components/ui/form-field-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { cn } from "@/core/utils/classname";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { Codebase, codebaseLabels, codebaseType } from "@my-project/shared";
import { Check, ChevronsUpDown, Package, Server, X } from "lucide-react";
import React from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { NAMES } from "../../../../pages/create/components/CreateCDPipelineWizard/names";
import { ApplicationRow } from "./components/ApplicationRow";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { ApplicationFieldArrayItem, ApplicationFieldArrayItemWithId, EditCDPipelineFormValues } from "../../types";

export const Applications: React.FC = () => {
  const applicationListWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.application,
    },
  });

  const applications = React.useMemo(() => applicationListWatch.data.array, [applicationListWatch.data.array]) as
    | Codebase[]
    | undefined;

  const {
    formState: { errors },
    control,
    getValues,
    setValue,
  } = useFormContext<EditCDPipelineFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: NAMES.ui_applicationsFieldArray,
    rules: {
      minLength: {
        value: 1,
        message: "At least one application is required.",
      },
    },
  });

  const [open, setOpen] = React.useState(false);
  const watchedApplications = useWatch({
    control,
    name: NAMES.ui_applicationsToAddChooser,
    defaultValue: [] as string[],
  });
  const selectedApplications = React.useMemo(() => watchedApplications || [], [watchedApplications]);

  // Helper: Remove app's branch from Docker streams
  const removeBranchFromDockerStreams = React.useCallback(
    (branchName: string) => {
      const currentStreams = getValues(NAMES.inputDockerStreams) || [];
      const newStreams = currentStreams.filter((stream: string) => stream !== branchName);
      setValue(NAMES.inputDockerStreams, newStreams, { shouldDirty: false });
    },
    [getValues, setValue]
  );

  // Helper: Sync applications and applicationsToPromote fields
  const syncApplicationFields = React.useCallback(
    (selectedApps: string[]) => {
      setValue(NAMES.applications, selectedApps, { shouldDirty: false });

      const promoteAll = getValues(NAMES.ui_applicationsToPromoteAll);
      setValue(NAMES.applicationsToPromote, promoteAll ? selectedApps : [], { shouldDirty: false });
    },
    [getValues, setValue]
  );

  // Helper: Add application to field array
  const addApplicationToFieldArray = React.useCallback(
    (appName: string) => {
      const currentFieldArray = (getValues(NAMES.ui_applicationsFieldArray) || []) as ApplicationFieldArrayItem[];
      const exists = currentFieldArray.some((app) => app.appName === appName);

      if (!exists) {
        append({ appName, appBranch: "", appToPromote: false });
      }
    },
    [getValues, append]
  );

  // Helper: Remove application from field array
  const removeApplicationFromFieldArray = React.useCallback(
    (appName: string) => {
      const currentFieldArray = (getValues(NAMES.ui_applicationsFieldArray) || []) as ApplicationFieldArrayItem[];
      const appToRemove = currentFieldArray.find((app) => app.appName === appName);

      // Remove branch from Docker streams if it exists
      if (appToRemove?.appBranch) {
        removeBranchFromDockerStreams(appToRemove.appBranch);
      }

      // Remove from field array
      const indexToRemove = currentFieldArray.findIndex((app) => app.appName === appName);
      if (indexToRemove >= 0) {
        remove(indexToRemove);
      }
    },
    [getValues, remove, removeBranchFromDockerStreams]
  );

  const handleSelectApp = React.useCallback(
    (appName: string) => {
      const isSelected = selectedApplications.includes(appName);
      const newSelected = isSelected
        ? selectedApplications.filter((name) => name !== appName)
        : [...selectedApplications, appName];

      // Update selection
      setValue(NAMES.ui_applicationsToAddChooser, newSelected, { shouldDirty: true });

      // Update field array
      if (isSelected) {
        removeApplicationFromFieldArray(appName);
      } else {
        addApplicationToFieldArray(appName);
      }

      // Sync related fields
      syncApplicationFields(newSelected);
    },
    [selectedApplications, setValue, removeApplicationFromFieldArray, addApplicationToFieldArray, syncApplicationFields]
  );

  const handleRemoveApp = React.useCallback(
    (appName: string) => {
      handleSelectApp(appName);
    },
    [handleSelectApp]
  );

  const isSelected = (appName: string) => {
    return selectedApplications.includes(appName);
  };

  const error = errors[NAMES.ui_applicationsToAddChooser];
  const hasError = !!error;
  const errorMessage = error?.message as string | undefined;
  const fieldId = React.useId();

  return (
    <LoadingWrapper isLoading={applicationListWatch.query.isLoading}>
      <div className="space-y-6">
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <FormFieldGroup label="Applications" error={hasError ? errorMessage : undefined} id={fieldId}>
              <Controller
                name={NAMES.ui_applicationsToAddChooser}
                control={control}
                rules={{
                  validate: (value) => {
                    if (!Array.isArray(value) || value.length === 0) {
                      return "At least one application is required.";
                    }
                    return true;
                  },
                }}
                render={({ field }) => {
                  const selectedApps = field.value || [];

                  return (
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className={cn(
                            "h-auto min-h-[42px] w-full justify-between py-2 font-normal",
                            "bg-input text-foreground hover:bg-input hover:text-foreground",
                            hasError && "border-destructive"
                          )}
                        >
                          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                            {selectedApps.length === 0 ? (
                              <span className="text-muted-foreground">Select applications...</span>
                            ) : (
                              selectedApps.map((appName) => (
                                <Badge key={appName} className="shrink-0 gap-1.5 pr-1 pl-2">
                                  {appName}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveApp(appName);
                                    }}
                                    className="hover:bg-input hover:text-foreground ml-1 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popper-anchor-width) max-w-2xl p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search applications..." />
                          <CommandList>
                            <CommandEmpty>No applications found.</CommandEmpty>
                            <CommandGroup>
                              {applications?.map((app) => {
                                const {
                                  spec: { lang, framework, buildTool, description, gitServer },
                                  metadata: { name },
                                } = app;

                                const selected = isSelected(name);
                                const codebaseMapping = getCodebaseMappingByType(codebaseType.application);
                                const langLower = lang?.toLowerCase() || "";
                                const frameworkLower = framework ? framework.toLowerCase() : "N/A";
                                const buildToolLower = buildTool?.toLowerCase() || "";
                                // Safe dynamic access with runtime check - requires type assertion due to dynamic key access
                                const codebaseMappingByLang = (
                                  langLower && codebaseMapping
                                    ? codebaseMapping[langLower as keyof typeof codebaseMapping]
                                    : undefined
                                ) as CodebaseInterface | undefined;

                                const langName = codebaseMappingByLang?.language?.name || capitalizeFirstLetter(lang);
                                const frameworkName =
                                  codebaseMappingByLang?.frameworks?.[frameworkLower]?.name ||
                                  (framework && capitalizeFirstLetter(framework)) ||
                                  "N/A";
                                const buildToolName =
                                  codebaseMappingByLang?.buildTools?.[buildToolLower]?.name ||
                                  capitalizeFirstLetter(buildTool);

                                return (
                                  <CommandItem
                                    key={name}
                                    value={name}
                                    onSelect={() => handleSelectApp(name)}
                                    className={cn("py-3")}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <Package className="text-muted-foreground h-4 w-4 shrink-0" />
                                        <span className="text-foreground font-medium">{name}</span>
                                      </div>
                                      {description && (
                                        <p className="text-muted-foreground mb-2 line-clamp-1 text-xs">{description}</p>
                                      )}
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        <div className="text-muted-foreground flex items-center gap-1">
                                          <UseSpriteSymbol
                                            name={getIconByPattern(lang)}
                                            width={12}
                                            height={12}
                                            className="text-muted-foreground"
                                          />
                                          <span>{langName}</span>
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-1">
                                          <UseSpriteSymbol
                                            name={getIconByPattern(framework)}
                                            width={12}
                                            height={12}
                                            className="text-muted-foreground"
                                          />
                                          <span>{frameworkName}</span>
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-1">
                                          <UseSpriteSymbol
                                            name={getIconByPattern(buildTool)}
                                            width={12}
                                            height={12}
                                            className="text-muted-foreground"
                                          />
                                          <span>{buildToolName}</span>
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-1">
                                          <Server className="h-3 w-3" />
                                          <span>{gitServer}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div
                                      className={cn(
                                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                        selected ? "bg-primary border-primary" : "border-border"
                                      )}
                                    >
                                      {selected && <Check className="text-primary-foreground h-3 w-3" />}
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </FormFieldGroup>

            {/* Empty State */}
            {(!fields || fields.length === 0) && (
              <EmptyList
                customText="No applications selected"
                description="Select applications from the dropdown above to configure their deployment branches."
                icon={<Package className="text-muted-foreground" size={48} />}
              />
            )}
          </div>

          {/* Application Branches Configuration - Grid */}
          {!!fields && !!fields.length && (
            <div className="grid grid-cols-1 gap-4">
              {fields.map((field, index) => {
                const fieldData = field as ApplicationFieldArrayItemWithId;
                const application = applications!.find((el) => el.metadata.name === fieldData.appName);

                if (!application) {
                  return null;
                }

                return (
                  <ApplicationRow
                    key={field.id}
                    application={application}
                    field={fieldData}
                    index={index}
                    removeRow={() => handleRemoveApp(fieldData.appName)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </LoadingWrapper>
  );
};
