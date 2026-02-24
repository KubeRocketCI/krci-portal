import { DialogTitle } from "@/core/components/ui/dialog";
import { FormGuideToggleButton } from "@/core/components/FormGuide";

export const DialogHeader = () => {
  return (
    <div className="flex items-start justify-between gap-1">
      <div className="flex flex-col gap-2">
        <DialogTitle className="text-xl font-medium">Create Link</DialogTitle>
      </div>
      <FormGuideToggleButton />
    </div>
  );
};
