import { TabPanel } from "@/core/components/TabPanel";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { Step, StepLabel, Stepper, useTheme } from "@mui/material";
import { FORM_STEPPER, FORM_STEPPER_STEPS } from "../../../../constants";
import { Applications, Description, PipelineName } from "../../../fields";

export const Form = () => {
  const { activeStep } = useStepperContext();
  const theme = useTheme();

  return (
    <>
      <div className="flex flex-col gap-4">
        <div style={{ paddingTop: theme.typography.pxToRem(24) }}>
          <Stepper activeStep={activeStep}>
            {FORM_STEPPER_STEPS.map((label) => {
              return (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </div>
        <div style={{ padding: `${theme.typography.pxToRem(24)} ${theme.typography.pxToRem(8)}` }}>
          <TabPanel value={activeStep} index={FORM_STEPPER.PIPELINE.idx}>
            <div className="flex flex-col gap-4">
              <PipelineName />
              <Description />
            </div>
          </TabPanel>
          <TabPanel value={activeStep} index={FORM_STEPPER.APPLICATIONS.idx}>
            <Applications />
          </TabPanel>
        </div>
      </div>
    </>
  );
};
