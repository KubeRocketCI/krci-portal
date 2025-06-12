import { TabPanel } from "@/core/components/TabPanel";
import { TileRadioGroup } from "@/core/providers/Form/components/MainRadioGroup";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { FieldEvent } from "@/core/types/forms";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
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
        <Typography fontSize={theme.typography.pxToRem(20)} fontWeight={500}>
          Create new component
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Box sx={{ pt: theme.typography.pxToRem(24) }}>
            <Stepper activeStep={activeStep}>
              {mainStepperSteps.map((label) => {
                return (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
          <Box sx={{ p: `${theme.typography.pxToRem(24)} ${theme.typography.pxToRem(8)}` }}>
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
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
          <Box sx={{ color: theme.palette.text.primary }}>
            <Button onClick={closeDialog} color="inherit" size="small">
              cancel
            </Button>
          </Box>
          <div>
            <TabPanel value={activeStep} index={selectionStepper.SELECT_COMPONENT.idx}>
              <Button variant="contained" onClick={nextStep} disabled={!componentTypeFieldValue} size="small">
                next
              </Button>
            </TabPanel>
            <TabPanel value={activeStep} index={selectionStepper.SELECT_STRATEGY.idx}>
              <Stack direction="row" spacing={1}>
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
              </Stack>
            </TabPanel>
          </div>
        </Stack>
      </DialogActions>
    </>
  );
};
