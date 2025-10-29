import { TabPanel } from "@/core/components/TabPanel";
import { TileRadioGroup } from "@/core/providers/Form/components/MainRadioGroup";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { FieldEvent } from "@/core/types/forms";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Step,
  StepLabel,
  Stepper,
  useTheme,
} from "@mui/material";
import { codebaseDeploymentScript, codebaseTestReportFramework, codebaseType } from "@my-project/shared";
import { mainStepperSteps, mainTabs, selectionStepper } from "../../../../constants";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../../names";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useCodebaseCreationStrategies } from "../Inner/hooks/useCodebaseCreationStrategies";
import { useCodebaseTypeOptions } from "../Inner/hooks/useCodebaseTypes";
import { SelectionProps } from "./types";

export const Selection = ({ setActiveTab }: SelectionProps) => {
  const theme = useTheme();
  const { activeStep, nextStep, prevStep } = useStepperContext();
  const {
    register,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useTypedFormContext();

  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const codebaseTypeOptions = useCodebaseTypeOptions();
  const codebaseCreationStrategies = useCodebaseCreationStrategies();

  const componentTypeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);
  const strategyFieldValue = watch(CODEBASE_FORM_NAMES.strategy.name);

  return (
    <>
      <DialogTitle>
        <h2 className="text-xl font-medium">
          Create new component
        </h2>
      </DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-4">
          <div className="pt-6">
            <Stepper activeStep={activeStep}>
              {mainStepperSteps.map((label) => {
                return (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </div>
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
                gridItemSize={6}
              />
            </TabPanel>
            <TabPanel value={activeStep} index={selectionStepper.SELECT_STRATEGY.idx}>
              <TileRadioGroup
                {...register(CODEBASE_FORM_NAMES.strategy.name)}
                control={control}
                errors={errors}
                options={codebaseCreationStrategies}
                gridItemSize={6}
              />
            </TabPanel>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <div className="flex flex-row gap-4 justify-between w-full">
          <div className="text-foreground">
            <Button onClick={closeDialog} color="inherit" size="small">
              cancel
            </Button>
          </div>
          <div>
            <TabPanel value={activeStep} index={selectionStepper.SELECT_COMPONENT.idx}>
              <Button variant="contained" onClick={nextStep} disabled={!componentTypeFieldValue} size="small">
                next
              </Button>
            </TabPanel>
            <TabPanel value={activeStep} index={selectionStepper.SELECT_STRATEGY.idx}>
              <div className="flex gap-1">
                <Button onClick={prevStep} size="small">
                  back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setActiveTab(mainTabs.configuration)}
                  disabled={!strategyFieldValue}
                  size="small"
                >
                  create
                </Button>
              </div>
            </TabPanel>
          </div>
        </div>
      </DialogActions>
    </>
  );
};
