import React from "react";
import { useStore } from "@tanstack/react-form";
import { STAGE_FORM_NAMES } from "../../../../../names";
import { QualityGateRowProps } from "./types";
import { FormStageQualityGate } from "../../../../../types";
import { SelectOption } from "@/core/types/forms";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import {
  StageQualityGateType,
  stageQualityGateType,
  Codebase,
  codebaseBranchLabels,
  codebaseLabels,
  codebaseType,
} from "@my-project/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useStageForm } from "../../../../../providers/form/hooks";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";

const getAvailableAutotests = (autotests: Codebase[]) => {
  return autotests.map((autotest) => {
    const name = autotest.metadata.name;

    return {
      name,
      disabled: false, // Always allow selection; branch availability will be validated separately
    };
  });
};

const getAvailableAutotestBranches = (
  currentQualityGateBranchesOptions: SelectOption<string>[],
  qualityGatesFieldValue: FormStageQualityGate[],
  currentQualityGateAutotestFieldValue: string
) => {
  return currentQualityGateBranchesOptions.map((branchOption) => {
    const qualityGatesByChosenAutotest = qualityGatesFieldValue.filter(
      ({ autotestName }) => autotestName === currentQualityGateAutotestFieldValue
    );

    const alreadyChosenAutotestBranch = qualityGatesByChosenAutotest.find(
      (qualityGate) => qualityGate.branchName === branchOption.value
    );

    if (alreadyChosenAutotestBranch) {
      return {
        ...branchOption,
        disabled: true,
      };
    }

    return branchOption;
  });
};

const getCurrentQualityGateBranchesOptions = (branches: string[]) => {
  return branches.map((branchName) => ({
    label: branchName,
    value: branchName,
  }));
};

const qualityGateTypeSelectOptions = mapArrayToSelectOptions(Object.values(stageQualityGateType));

const getAvailableQualityGateTypeSelectOptions = (autotests: Codebase[]) => {
  return qualityGateTypeSelectOptions.map((el) => {
    if (el.value === stageQualityGateType.autotests && !autotests.length) {
      return {
        ...el,
        disabled: true,
      };
    }

    return el;
  });
};

export const QualityGateRow = ({ namespace, currentQualityGate }: QualityGateRowProps) => {
  const form = useStageForm();

  // Subscribe to quality gates array
  const qualityGatesFieldValue = useStore(
    form.store,
    (state) => state.values[STAGE_FORM_NAMES.qualityGates.name] || []
  );

  // Find the current quality gate in the array to get its current values
  const currentGate = React.useMemo(
    () =>
      qualityGatesFieldValue.find((qg: FormStageQualityGate) => qg.id === currentQualityGate.id) || currentQualityGate,
    [qualityGatesFieldValue, currentQualityGate]
  );

  const currentQualityGateTypeFieldValue = currentGate.qualityGateType;
  const currentQualityGateAutotestFieldValue = currentGate.autotestName;

  const autotestsWatch = useCodebaseWatchList({
    namespace,
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.autotest,
    },
  });

  const branchesWatch = useCodebaseBranchWatchList({
    namespace,
    labels: {
      [codebaseBranchLabels.codebase]: currentQualityGateAutotestFieldValue || "",
    },
    queryOptions: {
      enabled: !!currentQualityGateAutotestFieldValue && !!namespace,
    },
  });

  const autotests = autotestsWatch.data.array;

  const availableQualityGateTypeSelectOptions = getAvailableQualityGateTypeSelectOptions(autotests);

  // Get branch names from the watched branches
  const branches = React.useMemo(
    () => branchesWatch.data.array.map((branch) => branch.spec.branchName),
    [branchesWatch.data.array]
  );

  const currentQualityGateBranchesOptions = getCurrentQualityGateBranchesOptions(branches);

  const availableAutotests = getAvailableAutotests(autotests);

  const availableAutotestBranches = getAvailableAutotestBranches(
    currentQualityGateBranchesOptions,
    qualityGatesFieldValue,
    currentQualityGateAutotestFieldValue || ""
  );

  const updateQualityGate = React.useCallback(
    (updates: Partial<FormStageQualityGate>) => {
      const currentGates = form.getFieldValue(STAGE_FORM_NAMES.qualityGates.name) || [];
      const newGates = currentGates.map((qualityGate: FormStageQualityGate) => {
        if (qualityGate.id !== currentQualityGate.id) {
          return qualityGate;
        }
        return {
          ...qualityGate,
          ...updates,
        };
      });
      form.setFieldValue(STAGE_FORM_NAMES.qualityGates.name, newGates);
    },
    [form, currentQualityGate.id]
  );

  const handleChangeQualityGateType = React.useCallback(
    (chosenQualityGateType: StageQualityGateType) => {
      if (chosenQualityGateType === stageQualityGateType.manual) {
        updateQualityGate({
          qualityGateType: chosenQualityGateType,
          autotestName: null,
          branchName: null,
        });
      } else {
        updateQualityGate({
          qualityGateType: chosenQualityGateType,
        });
      }
    },
    [updateQualityGate]
  );

  const handleChangeQualityGateStepName = React.useCallback(
    (chosenQualityGateStepName: string) => {
      updateQualityGate({ stepName: chosenQualityGateStepName });
    },
    [updateQualityGate]
  );

  const handleChangeQualityGateAutotestName = React.useCallback(
    (chosenQualityGateAutotest: string) => {
      updateQualityGate({
        autotestName: chosenQualityGateAutotest,
        branchName: null, // Reset branch when autotest changes
      });
    },
    [updateQualityGate]
  );

  const handleChangeQualityGateAutotestBranchName = React.useCallback(
    (chosenQualityGateAutotestsBranch: string) => {
      updateQualityGate({ branchName: chosenQualityGateAutotestsBranch });
    },
    [updateQualityGate]
  );

  return (
    <>
      <div>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <div className="relative">
              <Select value={currentQualityGateTypeFieldValue} onValueChange={handleChangeQualityGateType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quality gate type" />
                </SelectTrigger>
                <SelectContent>
                  {availableQualityGateTypeSelectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="pointer-events-none absolute top-2 right-2">
                <Tooltip title="Quality gates can be either manual approvals or autotests. To select autotest, create the corresponding codebase beforehand.">
                  <Info size={16} className="text-muted-foreground" />
                </Tooltip>
              </div>
            </div>
          </div>
          {currentQualityGateTypeFieldValue && currentQualityGateTypeFieldValue !== stageQualityGateType.manual && (
            <div className="col-span-3">
              <div className="relative">
                <Input
                  value={currentGate.stepName || ""}
                  onChange={(e) => handleChangeQualityGateStepName(e.target.value)}
                  placeholder="Enter step name"
                />
                <div className="pointer-events-none absolute top-2 right-2">
                  <Tooltip title="Name the deployment step within the stage to distinguish different phases of the deployment process.">
                    <Info size={16} className="text-muted-foreground" />
                  </Tooltip>
                </div>
              </div>
            </div>
          )}

          {!!autotests.length && currentQualityGateTypeFieldValue === stageQualityGateType.autotests ? (
            <>
              <div className="col-span-3">
                <div className="relative">
                  <Select
                    value={currentQualityGateAutotestFieldValue || ""}
                    onValueChange={handleChangeQualityGateAutotestName}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select autotest" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAutotests.map(({ name, disabled }) => (
                        <SelectItem key={name} value={name} disabled={disabled}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="pointer-events-none absolute top-2 right-2">
                    <Tooltip title="Specify an automated test to associate with this stage.">
                      <Info size={16} className="text-muted-foreground" />
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <Select
                    value={currentGate.branchName || ""}
                    onValueChange={handleChangeQualityGateAutotestBranchName}
                    disabled={!currentQualityGateBranchesOptions.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAutotestBranches.map((option) => (
                        <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="pointer-events-none absolute top-2 right-2">
                    <Tooltip title="Specify the branch for the automated tests.">
                      <Info size={16} className="text-muted-foreground" />
                    </Tooltip>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};
