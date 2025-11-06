import React from "react";

import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { mainTabs, unifiedStepperSteps, selectionStepper } from "../../constants";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { TabPanel } from "@/core/components/TabPanel";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { ValueOf } from "@/core/types/global";
import { SelectionHeader } from "./components/Selection/components/SelectionHeader";
import { SelectionFooter } from "./components/Selection/components/SelectionFooter";
import { Selection } from "./components/Selection";
import { DialogHeader as ConfigurationDialogHeader } from "./components/Inner/components/DialogHeader";
import { FormActions as ConfigurationFooter } from "./components/Inner/components/FormActions";
import { Configuration } from "./components/Inner";
import { UnifiedStepper } from "./components/UnifiedStepper";

const CreateContent = ({ baseDefaultValues }: { baseDefaultValues: ReturnType<typeof useDefaultValues> }) => {
  const { activeStep } = useStepperContext();
  const [activeTab, setActiveTab] = React.useState<ValueOf<typeof mainTabs>>(mainTabs.selection);

  // Automatically switch tabs based on active step
  React.useEffect(() => {
    if (activeStep <= selectionStepper.SELECT_STRATEGY.idx) {
      setActiveTab(mainTabs.selection);
    } else {
      setActiveTab(mainTabs.configuration);
    }
  }, [activeStep]);

  return (
    <>
      <DialogHeader>
        <div className="flex w-full flex-col gap-4">
          <TabPanel index={mainTabs.selection} value={activeTab}>
            <SelectionHeader />
          </TabPanel>
          <TabPanel index={mainTabs.configuration} value={activeTab}>
            <ConfigurationDialogHeader />
          </TabPanel>
          <UnifiedStepper steps={unifiedStepperSteps} />
        </div>
      </DialogHeader>
      <DialogBody>
        <TabPanel index={mainTabs.selection} value={activeTab}>
          <Selection />
        </TabPanel>
        <TabPanel index={mainTabs.configuration} value={activeTab}>
          <Configuration />
        </TabPanel>
      </DialogBody>
      <DialogFooter>
        <TabPanel index={mainTabs.selection} value={activeTab}>
          <SelectionFooter setActiveTab={setActiveTab} />
        </TabPanel>
        <TabPanel index={mainTabs.configuration} value={activeTab}>
          <ConfigurationFooter baseDefaultValues={baseDefaultValues} setActiveTab={setActiveTab} />
        </TabPanel>
      </DialogFooter>
    </>
  );
};

export const Create = () => {
  const baseDefaultValues = useDefaultValues();

  const formSettings = React.useMemo(
    () => ({
      mode: "onBlur" as const,
      defaultValues: baseDefaultValues,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(baseDefaultValues)]
  );

  return (
    <FormContextProvider formSettings={formSettings}>
      <StepperContextProvider>
        <CreateContent baseDefaultValues={baseDefaultValues} />
      </StepperContextProvider>
    </FormContextProvider>
  );
};
