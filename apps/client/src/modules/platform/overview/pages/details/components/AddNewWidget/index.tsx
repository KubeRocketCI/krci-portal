import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { Button } from "@/core/components/ui/button";
import { Plus } from "lucide-react";
import { AddNewWidget } from "../../dialogs/AddNewWidget";
import { WidgetConfig } from "../../dialogs/AddNewWidget/types";

export const AddNewWidgetCard = ({
  userWidgets,
  setUserWidgets,
}: {
  userWidgets: WidgetConfig[];
  setUserWidgets: (widgets: WidgetConfig[]) => void;
}) => {
  const { setDialog } = useDialogContext();

  return (
    <Button
      variant="ghost"
      className="bg-card h-full w-full rounded border shadow-xs"
      onClick={() => {
        setDialog(AddNewWidget, {
          userWidgets,
          setUserWidgets,
        });
      }}
    >
      <div className="flex flex-row items-center gap-4">
        <Plus size={16} />
        <span className="text-base font-medium">ADD WIDGET</span>
      </div>
    </Button>
  );
};
