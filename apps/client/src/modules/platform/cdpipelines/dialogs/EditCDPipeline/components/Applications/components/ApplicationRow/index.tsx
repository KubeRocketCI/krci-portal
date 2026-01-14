import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { NAMES } from "../../../../../../pages/create/components/CreateCDPipelineWizard/names";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch/hooks";
import { codebaseBranchLabels, sortKubeObjectByCreationTimestamp } from "@my-project/shared";
import { X, Package, GitBranch, Server } from "lucide-react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Codebase } from "@my-project/shared";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { cn } from "@/core/utils/classname";
import { ApplicationFieldArrayItemWithId, EditCDPipelineFormValues, getApplicationFieldError } from "../../../../types";

interface ApplicationRowProps {
  application: Codebase;
  field: ApplicationFieldArrayItemWithId;
  index: number;
  removeRow: () => void;
}

export const ApplicationRow = ({ application, index, removeRow }: ApplicationRowProps) => {
  const appName = application.metadata.name;
  const {
    spec: { lang, framework, buildTool, ciTool, type, description, gitServer, gitUrlPath, defaultBranch },
  } = application;

  const {
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext<EditCDPipelineFormValues>();

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

  const handleDeleteApplicationRow = React.useCallback(() => {
    removeRow();
  }, [removeRow]);

  // Track if we've initialized the default value to prevent re-setting
  const hasInitializedRef = React.useRef(false);

  // Set default value once when branches are loaded
  React.useEffect(() => {
    if (hasInitializedRef.current || sortedApplicationBranchList.length === 0) {
      return;
    }

    const currentBranchValue = getValues(rowAppBranchField);

    const availableBranches = sortedApplicationBranchList.map((el) => ({
      specBranchName: el.spec.branchName,
      metadataBranchName: el.metadata.name,
    }));

    const availableBranchNames = new Set(availableBranches.map((b) => b.metadataBranchName));

    // Check if current value is valid for this application
    const isCurrentValueValid = currentBranchValue && availableBranchNames.has(currentBranchValue);

    // Set default if no value is set or if current value is invalid for this application
    if (!isCurrentValueValid) {
      let newBranchFieldValue = "";

      // Use first available branch
      if (availableBranches.length > 0) {
        newBranchFieldValue = availableBranches[0].metadataBranchName;
      }

      if (newBranchFieldValue) {
        setValue(rowAppBranchField, newBranchFieldValue);

        // Maintain index alignment: set the branch at the same index as the application
        const currentInputDockerStreams = getValues(NAMES.inputDockerStreams) || [];
        const newInputDockerStreams = [...currentInputDockerStreams];
        newInputDockerStreams[index] = newBranchFieldValue;
        setValue(NAMES.inputDockerStreams, newInputDockerStreams);
      }
    }

    // Mark as initialized regardless of whether we set a value
    hasInitializedRef.current = true;
  }, [sortedApplicationBranchList, rowAppBranchField, getValues, setValue, index]);

  const appBranchError = getApplicationFieldError(errors, index, "appBranch");

  // Get codebase mapping for display names
  const codebaseMapping = getCodebaseMappingByType(type);
  const langLower = lang?.toLowerCase() || "";
  const frameworkLower = framework ? framework.toLowerCase() : "N/A";
  const buildToolLower = buildTool?.toLowerCase() || "";
  // Safe dynamic access with runtime check - requires type assertion due to dynamic key access
  const codebaseMappingByLang = (
    langLower && codebaseMapping ? codebaseMapping[langLower as keyof typeof codebaseMapping] : undefined
  ) as CodebaseInterface | undefined;

  // Get branch options
  const branchOptions = sortedApplicationBranchList.map((el) => ({
    label: el.spec.branchName,
    value: el.metadata.name,
    branchName: el.spec.branchName,
  }));

  return (
    <LoadingWrapper isLoading={applicationBranchListWatch.query.isLoading}>
      <Card className="p-6 shadow-none">
        {/* Header with App Name and Close Button */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Package className="text-primary h-5 w-5 shrink-0" />
              <h4 className="text-foreground font-medium">{appName}</h4>
            </div>
            {description && <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteApplicationRow}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-10 gap-8">
          {/* Left Half - Application Details (70% = col-span-7) */}
          <div className="col-span-7 space-y-4 pr-8">
            {/* Application Metadata */}
            <div className="grid grid-cols-8 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Type</div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Language</div>
                <div className="text-foreground flex items-center gap-1.5">
                  <UseSpriteSymbol
                    name={getIconByPattern(lang)}
                    width={14}
                    height={14}
                    className="text-muted-foreground"
                  />
                  {codebaseMappingByLang?.language?.name || capitalizeFirstLetter(lang)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Framework</div>
                <div className="text-foreground flex items-center gap-1.5">
                  <UseSpriteSymbol
                    name={getIconByPattern(framework)}
                    width={14}
                    height={14}
                    className="text-muted-foreground"
                  />
                  {codebaseMappingByLang?.frameworks?.[frameworkLower]?.name ||
                    (framework && capitalizeFirstLetter(framework)) ||
                    "N/A"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Build Tool</div>
                <div className="text-foreground flex items-center gap-1.5">
                  <UseSpriteSymbol
                    name={getIconByPattern(buildTool)}
                    width={14}
                    height={14}
                    className="text-muted-foreground"
                  />
                  {codebaseMappingByLang?.buildTools?.[buildToolLower]?.name || capitalizeFirstLetter(buildTool)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">CI Tool</div>
                <div className="text-foreground">{capitalizeFirstLetter(ciTool)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Git Server</div>
                <div className="text-foreground flex items-center gap-1.5">
                  <Server className="text-muted-foreground h-3.5 w-3.5" />
                  {gitServer}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground mb-1 text-xs">Repository Path</div>
                <div className="text-foreground truncate text-xs" title={gitUrlPath}>
                  {gitUrlPath}
                </div>
              </div>
            </div>
          </div>

          {/* Right Half - Branch Selection (30% = col-span-3) */}
          <div className="border-border col-span-3 flex flex-col justify-center border-l pl-8">
            <div className="space-y-4">
              <div>
                <Label htmlFor={`branch-select-${index}`} className="mb-3 flex items-center gap-2">
                  <GitBranch className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-medium">Select Branch for Deployment</span>
                </Label>
                <Controller
                  name={rowAppBranchField}
                  control={control}
                  rules={{
                    required: "Select branch",
                  }}
                  render={({ field }) => (
                    <>
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Maintain index alignment: update the branch at the same index as the application
                          const currentInputDockerStreamsValue = getValues(NAMES.inputDockerStreams) || [];
                          const newInputDockerStreamsValue = [...currentInputDockerStreamsValue];
                          newInputDockerStreamsValue[index] = value;
                          setValue(NAMES.inputDockerStreams, newInputDockerStreamsValue);
                        }}
                      >
                        <SelectTrigger
                          id={`branch-select-${index}`}
                          className={cn("w-full", appBranchError && "border-destructive")}
                        >
                          <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                        <SelectContent className="fixed">
                          {branchOptions.map((branch) => (
                            <SelectItem key={branch.value} value={branch.value}>
                              <div className="flex items-center gap-2">
                                <GitBranch className="text-muted-foreground h-3.5 w-3.5" />
                                {branch.branchName}
                                {branch.branchName === defaultBranch && (
                                  <Badge variant="outline" className="ml-1 text-xs">
                                    default
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {appBranchError && <p className="text-destructive mt-1 text-xs">{appBranchError.message}</p>}
                    </>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </LoadingWrapper>
  );
};
