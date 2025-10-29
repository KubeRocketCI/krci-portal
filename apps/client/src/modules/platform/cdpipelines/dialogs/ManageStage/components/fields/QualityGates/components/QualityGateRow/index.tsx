import React from "react";
import { useTypedFormContext } from "../../../../../hooks/useFormContext";
import { STAGE_FORM_NAMES } from "../../../../../names";
import {
  createQualityGateAutotestFieldName,
  createQualityGateStepNameFieldName,
  createQualityGateTypeAutotestsBranchFieldName,
  createQualityGateTypeFieldName,
} from "../../utils";
import { QualityGateRowProps } from "./types";
import { FormStageQualityGate } from "../../../../../types";
import { FieldEvent, SelectOption } from "@/core/types/forms";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import {
  StageQualityGateType,
  stageQualityGateType,
  Codebase,
  codebaseBranchLabels,
  codebaseLabels,
  codebaseType,
} from "@my-project/shared";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";

const getAvailableAutotests = (
  autotests: Codebase[],
  qualityGatesFieldValue: FormStageQualityGate[],
  currentQualityGateId: string
) => {
  return autotests.map((autotest) => {
    const name = autotest.metadata.name;

    // Check if this autotest is already used in other quality gates (excluding current one)
    const qualityGatesByChosenAutotest = qualityGatesFieldValue.filter(
      (qg) => qg.autotestName === name && qg.id !== currentQualityGateId
    );

    // An autotest can be selected multiple times if it has multiple branches
    // We can't determine if all branches are used without fetching all branches,
    // so we keep the autotest enabled. The branch selection will handle the validation.

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
  const {
    register,
    control,
    formState: { errors },
    watch,
    resetField,
    setValue,
  } = useTypedFormContext();

  const qualityGatesFieldValue = watch(STAGE_FORM_NAMES.qualityGates.name);

  const currentQualityGateTypeFieldValue = watch(createQualityGateTypeFieldName(currentQualityGate.id));
  const currentQualityGateAutotestFieldValue = watch(createQualityGateAutotestFieldName(currentQualityGate.id));

  const autotestsWatch = useCodebaseWatchList({
    namespace,
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.autotest,
    },
  });

  const branchesWatch = useCodebaseBranchWatchList({
    namespace,
    labels: {
      [codebaseBranchLabels.codebase]: currentQualityGateAutotestFieldValue,
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

  const availableAutotests = getAvailableAutotests(autotests, qualityGatesFieldValue, currentQualityGate.id);

  const availableAutotestBranches = getAvailableAutotestBranches(
    currentQualityGateBranchesOptions,
    qualityGatesFieldValue,
    currentQualityGateAutotestFieldValue
  );

  const handleChangeQualityGateType = React.useCallback(
    (event: FieldEvent<StageQualityGateType>) => {
      const chosenQualityGateType = event.target.value;

      if (chosenQualityGateType === stageQualityGateType.manual) {
        resetField(createQualityGateAutotestFieldName(currentQualityGate.id));
        resetField(createQualityGateTypeAutotestsBranchFieldName(currentQualityGate.id));
      }

      const newQualityGates = qualityGatesFieldValue.map((qualityGate: FormStageQualityGate) => {
        if (qualityGate.id !== currentQualityGate.id) {
          return qualityGate;
        }

        if (chosenQualityGateType === stageQualityGateType.manual) {
          return {
            ...qualityGate,
            autotestName: null,
            branchName: null,
            qualityGateType: chosenQualityGateType,
          };
        }

        return {
          ...qualityGate,
          qualityGateType: chosenQualityGateType,
        };
      });

      setValue(STAGE_FORM_NAMES.qualityGates.name, newQualityGates);
    },
    [currentQualityGate.id, qualityGatesFieldValue, resetField, setValue]
  );

  const handleChangeQualityGateStepName = React.useCallback(
    (event: FieldEvent<string>) => {
      const chosenQualityGateStepName = event.target.value;

      const newQualityGates = qualityGatesFieldValue.map((qualityGate: FormStageQualityGate) => {
        if (qualityGate.id !== currentQualityGate.id) {
          return qualityGate;
        }

        return {
          ...qualityGate,
          stepName: chosenQualityGateStepName,
        };
      });

      setValue(STAGE_FORM_NAMES.qualityGates.name, newQualityGates);
    },
    [currentQualityGate.id, qualityGatesFieldValue, setValue]
  );

  const handleChangeQualityGateAutotestName = React.useCallback(
    (event: FieldEvent<string>) => {
      const chosenQualityGateAutotest = event.target.value;
      resetField(createQualityGateTypeAutotestsBranchFieldName(currentQualityGate.id));

      const newQualityGates = qualityGatesFieldValue.map((qualityGate: FormStageQualityGate) => {
        if (qualityGate.id !== currentQualityGate.id) {
          return qualityGate;
        }

        return {
          ...qualityGate,
          autotestName: chosenQualityGateAutotest,
        };
      });

      setValue(STAGE_FORM_NAMES.qualityGates.name, newQualityGates);
    },
    [currentQualityGate.id, qualityGatesFieldValue, resetField, setValue]
  );

  const handleChangeQualityGateAutotestBranchName = React.useCallback(
    (event: FieldEvent<string>) => {
      const chosenQualityGateAutotestsBranch = event.target.value;

      const newQualityGates = qualityGatesFieldValue.map((qualityGate: FormStageQualityGate) => {
        if (qualityGate.id !== currentQualityGate.id) {
          return qualityGate;
        }

        return {
          ...qualityGate,
          branchName: chosenQualityGateAutotestsBranch,
        };
      });

      setValue(STAGE_FORM_NAMES.qualityGates.name, newQualityGates);
    },
    [currentQualityGate.id, qualityGatesFieldValue, setValue]
  );

  return (
    <>
      <div>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <FormSelect
              {...register(createQualityGateTypeFieldName(currentQualityGate.id), {
                onChange: handleChangeQualityGateType,
              })}
              label={"Quality gate type"}
              tooltipText={
                "Quality gates can be either manual approvals or autotests. To select autotest, create the corresponding codebase beforehand."
              }
              control={control}
              errors={errors}
              defaultValue={currentQualityGate.qualityGateType}
              options={availableQualityGateTypeSelectOptions}
            />
          </div>
          {currentQualityGateTypeFieldValue && currentQualityGateTypeFieldValue !== stageQualityGateType.manual && (
            <div className="col-span-3">
              <FormTextField
                {...register(createQualityGateStepNameFieldName(currentQualityGate.id), {
                  required: "Enter step name.",
                  onChange: handleChangeQualityGateStepName,
                })}
                label={"Step name"}
                tooltipText={
                  "Name the deployment step within the stage to distinguish different phases of the deployment process."
                }
                placeholder={"Enter step name"}
                control={control}
                errors={errors}
              />
            </div>
          )}

          {!!autotests.length && currentQualityGateTypeFieldValue === stageQualityGateType.autotests ? (
            <>
              <div className="col-span-3">
                <FormSelect
                  {...register(createQualityGateAutotestFieldName(currentQualityGate.id), {
                    onChange: handleChangeQualityGateAutotestName,
                  })}
                  label={"Autotest"}
                  tooltipText={"Specify an automated test to associate with this stage."}
                  control={control}
                  errors={errors}
                  options={availableAutotests.map(({ name, disabled }) => ({
                    label: name,
                    value: name,
                    disabled,
                  }))}
                />
              </div>
              <div className="col-span-3">
                <FormSelect
                  {...register(createQualityGateTypeAutotestsBranchFieldName(currentQualityGate.id), {
                    onChange: handleChangeQualityGateAutotestBranchName,
                  })}
                  label={"Autotest branch"}
                  tooltipText={"Specify the branch for the automated tests."}
                  control={control}
                  errors={errors}
                  disabled={!currentQualityGateBranchesOptions.length}
                  options={availableAutotestBranches}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};
