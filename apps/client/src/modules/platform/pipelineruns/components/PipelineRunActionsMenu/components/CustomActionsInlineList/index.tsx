import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import {
  ButtonGroup,
  ClickAwayListener,
  Grow,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  useTheme,
} from "@mui/material";
import { ChevronDown } from "lucide-react";
import React from "react";
import { CustomActionsInlineListProps } from "./types";

export const CustomActionsInlineList = ({ groupActions, inlineActions }: CustomActionsInlineListProps) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const pipelineRunPermissions = usePipelineRunPermissions();

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  const groupActionsWithoutFirstItem = groupActions.slice(1);
  const theme = useTheme();

  return (
    <>
      <Stack spacing={1} direction="row" alignItems="center">
        <ButtonGroup variant="outlined" ref={anchorRef}>
          <ButtonWithPermission
            ButtonProps={{
              startIcon: groupActions[0].Icon,
              size: "small",
              onClick: groupActions[0].action,
              sx: {
                height: "100%",
                color: theme.palette.secondary.dark,
                borderColor: theme.palette.secondary.dark,
              },
            }}
            allowed={pipelineRunPermissions.data.create.allowed}
            reason={pipelineRunPermissions.data.create.reason}
          >
            {groupActions[0].label}
          </ButtonWithPermission>
          <ButtonWithPermission
            ButtonProps={{
              size: "small",
              onClick: handleToggle,
              sx: {
                height: "100%",
                color: theme.palette.secondary.dark,
                borderColor: theme.palette.secondary.dark,
              },
            }}
            allowed={pipelineRunPermissions.data.create.allowed}
            reason={pipelineRunPermissions.data.create.reason}
          >
            <ChevronDown size={16} />
          </ButtonWithPermission>
        </ButtonGroup>
        <ActionsInlineList actions={inlineActions} />
      </Stack>

      <Popper sx={{ zIndex: 1 }} open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem>
                  {groupActionsWithoutFirstItem.map((option) => (
                    <MenuItem key={option.label} onClick={option.action}>
                      <ListItemIcon>{option.Icon}</ListItemIcon>
                      <ListItemText>{option.label}</ListItemText>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};
