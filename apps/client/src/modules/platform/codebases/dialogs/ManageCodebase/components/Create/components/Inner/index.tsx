import { TabPanel } from "@/core/components/TabPanel";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { configurationStepper } from "../../../../constants";
import { Form } from "./components/Form";

export const Configuration = () => {
  const { activeStep } = useStepperContext();

  return (
    <div className="px-2">
      <TabPanel value={activeStep} index={configurationStepper.CODEBASE_INFO.idx}>
        <Form />
      </TabPanel>
      <TabPanel value={activeStep} index={configurationStepper.ADVANCED_SETTINGS.idx}>
        <Form />
      </TabPanel>
    </div>
  );
};
