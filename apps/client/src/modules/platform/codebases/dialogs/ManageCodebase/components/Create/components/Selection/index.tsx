import { TabPanel } from "@/core/components/TabPanel";
import { TileRadioGroup } from "@/core/providers/Form/components/MainRadioGroup";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { FieldEvent } from "@/core/types/forms";
import { codebaseDeploymentScript, codebaseTestReportFramework, codebaseType } from "@my-project/shared";
import { selectionStepper } from "../../../../constants";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../../names";
import { useCodebaseCreationStrategies } from "../Inner/hooks/useCodebaseCreationStrategies";
import { useCodebaseTypeOptions } from "../Inner/hooks/useCodebaseTypes";

export const Selection = () => {
  const { activeStep } = useStepperContext();
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useTypedFormContext();

  const codebaseTypeOptions = useCodebaseTypeOptions();
  const codebaseCreationStrategies = useCodebaseCreationStrategies();

  return (
    <div className="p-6 px-2">
      <TabPanel value={activeStep} index={selectionStepper.SELECT_COMPONENT.idx}>
        <TileRadioGroup
          {...register(CODEBASE_FORM_NAMES.type.name, {
            onChange: ({ target: { value } }: FieldEvent) => {
              switch (value) {
                case codebaseType.application:
                  setValue(CODEBASE_FORM_NAMES.deploymentScript.name, codebaseDeploymentScript["helm-chart"], {
                    shouldDirty: false,
                  });
                  break;
                case codebaseType.autotest:
                  setValue(CODEBASE_FORM_NAMES.testReportFramework.name, codebaseTestReportFramework.allure, {
                    shouldDirty: false,
                  });
                  break;
              }
            },
          })}
          control={control}
          errors={errors}
          options={codebaseTypeOptions}
          gridCols={2}
        />
      </TabPanel>
      <TabPanel value={activeStep} index={selectionStepper.SELECT_STRATEGY.idx}>
        <TileRadioGroup
          {...register(CODEBASE_FORM_NAMES.strategy.name)}
          control={control}
          errors={errors}
          options={codebaseCreationStrategies}
          gridCols={2}
        />
      </TabPanel>
    </div>
  );
};
