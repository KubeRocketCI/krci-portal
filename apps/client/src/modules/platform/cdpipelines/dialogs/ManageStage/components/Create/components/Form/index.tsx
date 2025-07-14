import { Box, Grid, Stack, Step, StepLabel, Stepper, useTheme } from "@mui/material";
import React from "react";
import { FORM_STEPPER, FORM_STEPPER_STEPS } from "../../../../constants";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import {
  CleanTemplate,
  Cluster,
  DeployTemplate,
  Description,
  Namespace,
  QualityGates,
  StageName,
  TriggerType,
} from "../../../fields";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { TabPanel } from "@/core/components/TabPanel";

export const Form = () => {
  const {
    props: { otherStages },
  } = useCurrentDialog();

  const otherStagesNames = React.useMemo(() => otherStages.map(({ spec: { name } }) => name), [otherStages]);

  const theme = useTheme();

  const { activeStep } = useStepperContext();

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
          <TabPanel value={activeStep} index={FORM_STEPPER.CONFIGURATION.idx}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Cluster />
              </Grid>
              <Grid item xs={6}>
                <StageName otherStagesNames={otherStagesNames} />
              </Grid>
              <Grid item xs={6}>
                <Namespace />
              </Grid>
              <Grid item xs={6}>
                <Description />
              </Grid>
              <Grid item xs={6}>
                <TriggerType />
              </Grid>
              <Grid item xs={6}>
                <DeployTemplate />
              </Grid>
              <Grid item xs={6}>
                <CleanTemplate />
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value={activeStep} index={FORM_STEPPER.QUALITY_GATES.idx}>
            <QualityGates />
          </TabPanel>
        </Box>
      </Stack>
    </>
  );
};
