import { TabPanel } from "@/core/components/TabPanel";
import { Button } from "@/core/components/ui/button";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { mainTabs, selectionStepper } from "../../../../../../constants";
import { useTypedFormContext } from "../../../../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../../../../names";
import { useCurrentDialog } from "../../../../../../providers/CurrentDialog/hooks";
import { SelectionFooterProps } from "./types";

export const SelectionFooter = ({ setActiveTab }: SelectionFooterProps) => {
  const { activeStep, nextStep, prevStep } = useStepperContext();
  const { watch } = useTypedFormContext();

  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const componentTypeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);
  const strategyFieldValue = watch(CODEBASE_FORM_NAMES.strategy.name);

  const handleNext = () => {
    nextStep();
    // Switch to configuration tab when moving from step 1 to step 2
    if (activeStep === selectionStepper.SELECT_STRATEGY.idx) {
      setActiveTab(mainTabs.configuration);
    }
  };

  return (
    <div className="flex w-full flex-row justify-between gap-4">
      <div className="text-foreground">
        <Button onClick={closeDialog} variant="ghost" size="sm">
          Cancel
        </Button>
      </div>
      <div>
        <TabPanel value={activeStep} index={selectionStepper.SELECT_COMPONENT.idx}>
          <Button variant="default" onClick={handleNext} disabled={!componentTypeFieldValue} size="sm">
            Next
          </Button>
        </TabPanel>
        <TabPanel value={activeStep} index={selectionStepper.SELECT_STRATEGY.idx}>
          <div className="flex gap-1">
            <Button onClick={prevStep} variant="ghost" size="sm">
              Back
            </Button>
            <Button variant="default" onClick={handleNext} disabled={!strategyFieldValue} size="sm">
              Next
            </Button>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};

