import { Step, StepLabel, Stepper, useTheme } from "@mui/material";
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
          <TabPanel value={activeStep} index={FORM_STEPPER.CONFIGURATION.idx}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <Cluster />
              </div>
              <div>
                <StageName otherStagesNames={otherStagesNames} />
              </div>
              <div>
                <Namespace />
              </div>
              <div>
                <Description />
              </div>
              <div>
                <TriggerType />
              </div>
              <div>
                <DeployTemplate />
              </div>
              <div>
                <CleanTemplate />
              </div>
            </div>
          </TabPanel>
          <TabPanel value={activeStep} index={FORM_STEPPER.QUALITY_GATES.idx}>
            <QualityGates />
          </TabPanel>
        </div>
      </div>
    </>
  );
};
