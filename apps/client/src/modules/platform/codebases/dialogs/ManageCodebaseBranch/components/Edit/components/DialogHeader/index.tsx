import { DialogTitle } from "@/core/components/ui/dialog";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";

export const DialogHeader = () => {
  const {
    props: { codebaseBranch },
  } = useCurrentDialog();

  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex flex-col gap-4">
        <DialogTitle className="text-xl font-medium">{`Edit ${codebaseBranch?.spec.branchName}`}</DialogTitle>
      </div>
    </div>
  );
};
