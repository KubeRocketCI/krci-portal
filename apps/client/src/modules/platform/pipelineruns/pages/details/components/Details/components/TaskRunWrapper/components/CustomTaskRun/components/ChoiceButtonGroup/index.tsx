import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useApprovalTaskPermissions } from "@/k8s/api/groups/KRCI/ApprovalTask";
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
} from "@mui/material";
import { ChevronDown } from "lucide-react";
import React from "react";

export const ChoiceButtonGroup = ({
  options,
  type,
}: {
  options: { id: string; Icon: React.ReactNode; label: string; onClick: () => void }[];
  type: "accept" | "reject";
}) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  const optionsWithoutFirstItem = options.slice(1);

  const approvalTaskPermissions = useApprovalTaskPermissions();

  return (
    <>
      <ButtonGroup variant={type === "accept" ? "contained" : "outlined"} ref={anchorRef}>
        <ButtonWithPermission
          ButtonProps={{
            size: "small",
            startIcon: options[0].Icon,
            onClick: options[0].onClick,
          }}
          allowed={approvalTaskPermissions.data?.patch?.allowed}
          reason={approvalTaskPermissions.data?.patch?.reason}
        >
          {options[0].label}
        </ButtonWithPermission>
        <ButtonWithPermission
          ButtonProps={{
            size: "small",
            onClick: handleToggle,
            sx: { height: "100%" },
          }}
          allowed={approvalTaskPermissions.data?.patch?.allowed}
          reason={approvalTaskPermissions.data?.patch?.reason}
        >
          <ChevronDown size={15} />
        </ButtonWithPermission>
      </ButtonGroup>
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
                  {optionsWithoutFirstItem.map((option) => (
                    <MenuItem key={option.id} onClick={option.onClick}>
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
