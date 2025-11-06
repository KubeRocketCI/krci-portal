import { TabPanel } from "@/core/components/TabPanel";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { FORM_STEPPER } from "../../../../constants";
import { Applications, Description, PipelineName } from "../../../fields";

export const Form = () => {
  const { activeStep } = useStepperContext();

  return (
    <div className="p-6 px-2">
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
  );
};
