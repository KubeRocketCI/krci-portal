import React from "react";
import { FORM_STEPPER } from "../../../../constants";
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

  const { activeStep } = useStepperContext();

  return (
    <div className="p-6 px-2">
      <TabPanel value={activeStep} index={FORM_STEPPER.CONFIGURATION.idx}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
  );
};
