import { EmptyList } from "@/core/components/EmptyList";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command";
import { FormFieldGroup } from "@/core/components/ui/form-field-group";
import { Label } from "@/core/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { cn } from "@/core/utils/classname";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getCodebaseMappingByType, useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import {
  Codebase,
  codebaseLabels,
  codebaseType,
  codebaseBranchLabels,
  sortKubeObjectByCreationTimestamp,
} from "@my-project/shared";
import { AlertCircle, Check, ChevronsUpDown, GitBranch, Package, Server, X } from "lucide-react";
import React from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { CreateCDPipelineFormValues, NAMES } from "../../names";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch/hooks";
import { FieldError } from "react-hook-form";

interface ApplicationCardProps {
  application: Codebase;
  field: { id: string; appName: string; appBranch: string; appToPromote: boolean };
  index: number;
  removeRow: () => void;
  control: ReturnType<typeof useFormContext<CreateCDPipelineFormValues>>["control"];
  getValues: ReturnType<typeof useFormContext<CreateCDPipelineFormValues>>["getValues"];
  setValue: ReturnType<typeof useFormContext<CreateCDPipelineFormValues>>["setValue"];
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  index,
  removeRow,
  control,
  getValues,
  setValue,
}) => {
  const appName = application.metadata.name;
  const {
    spec: { lang, framework, buildTool, description, gitServer, defaultBranch },
  } = application;

  const applicationBranchListWatch = useCodebaseBranchWatchList({
    labels: {
      [codebaseBranchLabels.codebase]: application.metadata.name,
    },
  });

  const sortedApplicationBranchList = React.useMemo(() => {
    if (!applicationBranchListWatch.data.array) return [];
    return [...applicationBranchListWatch.data.array].sort(sortKubeObjectByCreationTimestamp);
  }, [applicationBranchListWatch.data.array]);

  const rowAppBranchField = `${NAMES.ui_applicationsFieldArray}.${index}.appBranch` as const;
  const rowAppBranchFieldValue = useWatch({
    control,
    name: rowAppBranchField,
  });

  const {
    formState: { errors },
  } = useFormContext<CreateCDPipelineFormValues>();

  const appBranchError = (
    errors?.[NAMES.ui_applicationsFieldArray] as Record<number, { appBranch: FieldError }> | undefined
  )?.[index]?.appBranch;

  const hasValidationError = !!appBranchError;

  // Get codebase mapping for display names
  const codebaseMapping = getCodebaseMappingByType(codebaseType.application);
  const langLower = lang?.toLowerCase() || "";
  const frameworkLower = framework ? framework.toLowerCase() : "N/A";
  const buildToolLower = buildTool?.toLowerCase() || "";
  const codebaseMappingByLang = codebaseMapping?.[
    langLower as keyof typeof codebaseMapping
  ] as unknown as CodebaseInterface;

  const langName = codebaseMappingByLang?.language?.name || capitalizeFirstLetter(lang);
  const frameworkName =
    codebaseMappingByLang?.frameworks?.[frameworkLower]?.name ||
    (framework && capitalizeFirstLetter(framework)) ||
    "N/A";
  const buildToolName = codebaseMappingByLang?.buildTools?.[buildToolLower]?.name || capitalizeFirstLetter(buildTool);

  // Get branch options
  const branchOptions = sortedApplicationBranchList.map((el) => ({
    label: el.spec.branchName,
    value: el.metadata.name,
    branchName: el.spec.branchName,
  }));

  // Track if we've initialized the default value to prevent re-setting
  const hasInitializedRef = React.useRef(false);

  // Set default value once when branches are loaded
  if (
    !hasInitializedRef.current &&
    !applicationBranchListWatch.query.isLoading &&
    sortedApplicationBranchList.length > 0
  ) {
    const currentBranchValue = getValues(rowAppBranchField);

    // Only set default if no value is set yet
    if (!currentBranchValue) {
      const availableBranches = sortedApplicationBranchList.map((el) => ({
        specBranchName: el.spec.branchName,
        metadataBranchName: el.metadata.name,
      }));

      let newBranchFieldValue = "";

      // Use first available branch
      if (availableBranches.length > 0) {
        newBranchFieldValue = availableBranches[0].metadataBranchName;
      }

      if (newBranchFieldValue) {
        setValue(rowAppBranchField, newBranchFieldValue);

        const currentInputDockerStreams = getValues(NAMES.inputDockerStreams) || [];
        if (!currentInputDockerStreams.includes(newBranchFieldValue)) {
          setValue(NAMES.inputDockerStreams, [...currentInputDockerStreams, newBranchFieldValue]);
        }

        hasInitializedRef.current = true;
      }
    } else {
      // If there's already a value, mark as initialized
      hasInitializedRef.current = true;
    }
  }

  return (
    <LoadingWrapper isLoading={applicationBranchListWatch.query.isLoading}>
      <Card
        className={cn(
          "relative flex flex-col p-5 transition-all",
          hasValidationError && "border-primary/50 bg-primary/5 dark:bg-primary/10"
        )}
      >
        {/* Validation Error Banner */}
        {hasValidationError && (
          <div className="border-primary/30 bg-primary/10 text-primary dark:bg-primary/20 absolute top-0 right-0 left-0 flex items-center gap-2 rounded-t-lg border-b px-3 py-1.5">
            <AlertCircle className="text-primary h-3.5 w-3.5" />
            <span className="text-xs">Branch required</span>
          </div>
        )}

        {/* Remove Button */}
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

          <div className="mt-auto space-y-2 text-xs">
            <div className="flex items-center gap-4">
              <div className="text-foreground flex items-center gap-1">
                <UseSpriteSymbol
                  name={getIconByPattern(lang)}
                  width={12}
                  height={12}
                  className="text-muted-foreground"
                />
                <span>{langName}</span>
              </div>
              <div className="text-foreground flex items-center gap-1">
                <UseSpriteSymbol
                  name={getIconByPattern(framework)}
                  width={12}
                  height={12}
                  className="text-muted-foreground"
                />
                <span>{frameworkName}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-foreground flex items-center gap-1">
                <UseSpriteSymbol
                  name={getIconByPattern(buildTool)}
                  width={12}
                  height={12}
                  className="text-muted-foreground"
                />
                <span>{buildToolName}</span>
              </div>
              <div className="text-foreground flex items-center gap-1">
                <Server className="text-muted-foreground h-3 w-3" />
                <span>{gitServer}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-2">
            <Label htmlFor={`branch-select-grid-${index}`} className="mb-2 flex items-center gap-1.5 text-xs">
              <GitBranch className="h-3 w-3" />
              Branch
              {hasValidationError && <span className="text-destructive">*</span>}
            </Label>
            <Controller
              name={rowAppBranchField}
              control={control}
              rules={{
                required: "Select branch",
              }}
              render={({ field: branchField }) => (
                <>
                  <Select
                    value={branchField.value || ""}
                    onValueChange={(value) => {
                      branchField.onChange(value);
                      const currentInputDockerStreamsValue = getValues(NAMES.inputDockerStreams) || [];
                      const newInputDockerStreamsValue = [
                        ...currentInputDockerStreamsValue.filter((el: string) => el !== rowAppBranchFieldValue),
                        value,
                      ] as string[];
                      setValue(NAMES.inputDockerStreams, newInputDockerStreamsValue);
                    }}
                  >
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
                            {branch.branchName === defaultBranch && (
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
                      {appBranchError.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>
        </div>
      </Card>
    </LoadingWrapper>
  );
};

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
  } = useFormContext<CreateCDPipelineFormValues>();

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
  const selectedApplications = (useWatch({
    control,
    name: NAMES.ui_applicationsToAddChooser,
    defaultValue: [],
  }) || []) as string[];

  const handleSelectApp = (appName: string) => {
    const currentSelected = selectedApplications;
    const isSelected = currentSelected.includes(appName);
    const newSelected = isSelected ? currentSelected.filter((name) => name !== appName) : [...currentSelected, appName];

    // Update form value
    setValue(NAMES.ui_applicationsToAddChooser, newSelected, { shouldDirty: true });

    // Get current field array value
    const currentFieldArray = getValues(NAMES.ui_applicationsFieldArray) || [];

    if (isSelected) {
      // Remove from field array
      const indexToRemove = currentFieldArray.findIndex((app) => app.appName === appName);
      if (indexToRemove >= 0) {
        remove(indexToRemove);
      }
    } else {
      // Add to field array
      const exists = currentFieldArray.some((app) => app.appName === appName);
      if (!exists) {
        append({ appName, appBranch: "", appToPromote: false });
      }
    }

    // Sync applications and applicationsToPromote fields
    setValue(NAMES.applications, newSelected, { shouldDirty: false });
    const applicationsToPromoteAllFieldValue = getValues(NAMES.ui_applicationsToPromoteAll);
    setValue(NAMES.applicationsToPromote, applicationsToPromoteAllFieldValue ? newSelected : [], {
      shouldDirty: false,
    });
  };

  const handleRemoveApp = (appName: string) => {
    handleSelectApp(appName);
  };

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
                  const selectedApps = (field.value || []) as string[];

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
                      <PopoverContent className="z-50 w-(--radix-popper-anchor-width) max-w-2xl p-0" align="start">
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
                                const codebaseMappingByLang = codebaseMapping?.[
                                  langLower as keyof typeof codebaseMapping
                                ] as unknown as CodebaseInterface;

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fields.map((field, index) => {
                const application = applications!.find((el) => el.metadata.name === field.appName);

                if (!application) {
                  return null;
                }

                return (
                  <ApplicationCard
                    key={field.id}
                    application={application}
                    field={field}
                    index={index}
                    removeRow={() => {
                      const appName = field.appName;
                      remove(index);
                      const currentSelected = getValues(NAMES.ui_applicationsToAddChooser) || [];
                      const newSelected = currentSelected.filter((name: string) => name !== appName);
                      setValue(NAMES.ui_applicationsToAddChooser, newSelected, { shouldDirty: true });
                      setValue(NAMES.applications, newSelected, { shouldDirty: false });
                    }}
                    control={control}
                    getValues={getValues}
                    setValue={setValue}
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
