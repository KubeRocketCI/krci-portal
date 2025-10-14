import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { Box, DialogActions, DialogContent, DialogTitle, Step, StepLabel, Stepper, useTheme } from "@mui/material";
import { configurationStepperSteps } from "../../../../constants";
import { DialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useStyles } from "./styles";
import { ConfigurationProps } from "./types";

export const Configuration = ({ baseDefaultValues, setActiveTab }: ConfigurationProps) => {
  const theme = useTheme();
  const { activeStep } = useStepperContext();
  const classes = useStyles();

  return (
    <>
      <DialogTitle>
        <DialogHeader />
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <div className={classes.dialogContentForm}>
          <Box sx={{ pt: theme.typography.pxToRem(24) }}>
            <Stepper activeStep={activeStep}>
              {configurationStepperSteps.map((label) => {
                return (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            <Box sx={{ p: `${theme.typography.pxToRem(24)} ${theme.typography.pxToRem(8)}` }}>
              <Form />
            </Box>
          </Box>
        </div>
      </DialogContent>
      <DialogActions>
        <FormActions baseDefaultValues={baseDefaultValues} setActiveTab={setActiveTab} />
      </DialogActions>
    </>
  );
};
