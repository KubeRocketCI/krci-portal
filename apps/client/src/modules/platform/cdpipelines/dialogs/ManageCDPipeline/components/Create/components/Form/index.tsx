import { TabPanel } from "@/core/components/TabPanel";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { Box, Stack, Step, StepLabel, Stepper, useTheme } from "@mui/material";
import { FORM_STEPPER, FORM_STEPPER_STEPS } from "../../../../constants";
import { Applications, Description, PipelineName } from "../../../fields";

export const Form = () => {
  const { activeStep } = useStepperContext();
  const theme = useTheme();

  return (
    <>
      <Stack spacing={2}>
        <Box sx={{ pt: theme.typography.pxToRem(24) }}>
          <Stepper activeStep={activeStep}>
            {FORM_STEPPER_STEPS.map((label) => {
              return (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>
        <Box sx={{ p: `${theme.typography.pxToRem(24)} ${theme.typography.pxToRem(8)}` }}>
          <TabPanel value={activeStep} index={FORM_STEPPER.PIPELINE.idx}>
            <Stack spacing={2}>
              <PipelineName />
              <Description />
            </Stack>
          </TabPanel>
          <TabPanel value={activeStep} index={FORM_STEPPER.APPLICATIONS.idx}>
            <Applications />
          </TabPanel>
        </Box>
      </Stack>
    </>
  );
};
