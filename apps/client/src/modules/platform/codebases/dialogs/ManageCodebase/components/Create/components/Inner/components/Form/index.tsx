import { TabPanel } from "@/core/components/TabPanel";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { configurationStepper } from "@/modules/platform/codebases/dialogs/ManageCodebase/constants";
import { Advanced } from "./components/Advanced";
import { Info } from "./components/Info";

export const Form = () => {
  const { activeStep } = useStepperContext();

  return (
    <>
      <TabPanel value={activeStep} index={configurationStepper.CODEBASE_INFO.idx}>
        <Info />
      </TabPanel>
      <TabPanel value={activeStep} index={configurationStepper.ADVANCED_SETTINGS.idx}>
        <Advanced />
      </TabPanel>
    </>
  );
};
