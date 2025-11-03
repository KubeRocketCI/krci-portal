import { Button, IconButton, Tooltip, useTheme } from "@mui/material";
import { ActionsInlineListProps } from "./types";

export const ActionsInlineList = ({ actions }: ActionsInlineListProps) => {
  const theme = useTheme();

  return (
    <div className="flex flex-row items-center gap-2">
      {actions.map(({ name, action, disabled, Icon, label, isTextButton }, idx) => {
        const actionId = `${name}:${idx}`;

        return isTextButton ? (
          <Button
            size="small"
            onClick={action}
            variant="outlined"
            disabled={disabled?.status}
            endIcon={Icon}
            sx={{ color: theme.palette.secondary.dark, borderColor: theme.palette.secondary.dark }}
          >
            {name}
          </Button>
        ) : (
          <div key={actionId}>
            <Tooltip title={disabled?.reason || label}>
              <div>
                <IconButton
                  component="span"
                  disabled={disabled?.status}
                  onClick={action}
                  size="medium"
                  sx={{ color: theme.palette.secondary.dark }}
                >
                  {Icon}
                </IconButton>
              </div>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};
