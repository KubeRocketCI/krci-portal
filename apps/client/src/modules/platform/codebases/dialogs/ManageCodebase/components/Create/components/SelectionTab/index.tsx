import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";
import { SelectionHeader } from "../Selection/components/SelectionHeader";
import { SelectionFooter } from "../Selection/components/SelectionFooter";
import { Selection } from "../Selection";
import { SelectionTabProps } from "./types";

export const SelectionTab = ({ setActiveTab }: SelectionTabProps) => {
  return (
    <StepperContextProvider>
      <DialogHeader>
        <SelectionHeader />
      </DialogHeader>
      <DialogBody>
        <Selection />
      </DialogBody>
      <DialogFooter>
        <SelectionFooter setActiveTab={setActiveTab} />
      </DialogFooter>
    </StepperContextProvider>
  );
};

