import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { IconButton } from "@mui/material";
import { Plus } from "lucide-react";
import { AddNewWidget } from "../../dialogs/AddNewWidget";
import { WidgetConfig } from "../../dialogs/AddNewWidget/types";
import { useStyles } from "./styles";

export const AddNewWidgetCard = ({
  userWidgets,
  setUserWidgets,
}: {
  userWidgets: WidgetConfig[];
  setUserWidgets: (widgets: WidgetConfig[]) => void;
}) => {
  const classes = useStyles();

  const { setDialog } = useDialogContext();

  return (
    <IconButton
      className={classes.cardRoot}
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
    </IconButton>
  );
};
