import { DialogTitle } from "@/core/components/ui/dialog";
import { FormGuideToggleButton } from "@/core/components/FormGuide";

interface DialogHeaderProps {
  codebaseName: string;
}

export const DialogHeader = ({ codebaseName }: DialogHeaderProps) => {
  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex gap-4">
        <DialogTitle className="text-xl font-medium">{`Create branch for "${codebaseName}"`}</DialogTitle>
      </div>
      <FormGuideToggleButton />
    </div>
  );
};
