import { DialogTitle } from "@/core/components/ui/dialog";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";

export const DialogHeader = () => {
  const {
    props: { quickLink },
  } = useCurrentDialog();

  return (
    <div className="flex items-start justify-between gap-1">
      <div className="flex flex-col gap-2">
        <DialogTitle className="text-xl font-medium">{`Edit ${quickLink?.metadata.name}`}</DialogTitle>
      </div>
    </div>
  );
};
