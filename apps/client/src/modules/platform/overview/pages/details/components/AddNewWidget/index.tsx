import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { IconButton, Stack, Typography } from "@mui/material";
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
      <Stack direction="row" spacing={2} alignItems="center">
        <Plus size={16} color={"inherit"} />
        <Typography fontSize="15px" fontWeight={500}>
          ADD WIDGET
        </Typography>
      </Stack>
    </IconButton>
  );
};
