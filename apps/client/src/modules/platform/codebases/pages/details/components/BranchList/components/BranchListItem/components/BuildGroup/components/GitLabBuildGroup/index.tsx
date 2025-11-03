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
  useTheme,
} from "@mui/material";

import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { StatusIcon } from "@/core/components/StatusIcon";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import { ChevronDown, LoaderCircle, Play } from "lucide-react";
import { GitLabBuildGroupProps } from "./types";

export const GitLabBuildGroup = ({
  codebaseBranch,
  handleOpenGitLabParamsDialog,
  handleDirectGitLabBuild,
  menuAnchorEl,
  handleClickMenu,
  handleCloseMenu,
  isGitLabLoading,
}: GitLabBuildGroupProps) => {
  const open = Boolean(menuAnchorEl);
  const id = open ? "simple-popper" : undefined;

  const theme = useTheme();

  const pipelineRunPermissions = usePipelineRunPermissions();

  const codebaseBranchStatusIsOk = codebaseBranch?.status?.status === CUSTOM_RESOURCE_STATUS.CREATED;

  const buildButtonDisabled =
    !pipelineRunPermissions.data.create.allowed || !codebaseBranchStatusIsOk || isGitLabLoading;

  const buildButtonTooltip = (() => {
    if (!pipelineRunPermissions.data.create.allowed) {
      return pipelineRunPermissions.data.create.reason;
    }

    if (isGitLabLoading) {
      return "Triggering GitLab pipeline...";
    }

    if (!codebaseBranchStatusIsOk) {
      return `Codebase branch status is ${codebaseBranch?.status?.status}`;
    }

    return "Trigger GitLab CI pipeline";
  })();

  return (
    <>
      <ButtonGroup variant="outlined" sx={{ color: theme.palette.text.primary }}>
        <ButtonWithPermission
          ButtonProps={{
            startIcon: isGitLabLoading ? (
              <StatusIcon Icon={LoaderCircle} isSpinning color={theme.palette.secondary.dark} />
            ) : (
              <Play size={20} />
            ),
            onClick: handleDirectGitLabBuild,
            size: "small",
            sx: {
              height: "100%",
              color: theme.palette.secondary.dark,
              borderColor: theme.palette.secondary.dark,
            },
          }}
          allowed={!buildButtonDisabled}
          reason={buildButtonTooltip}
        >
          {isGitLabLoading ? "building" : "build"}
        </ButtonWithPermission>
        <ButtonWithPermission
          ButtonProps={{
            size: "small",
            onClick: handleClickMenu,
            sx: {
              height: "100%",
              color: theme.palette.secondary.dark,
              borderColor: theme.palette.secondary.dark,
            },
          }}
          allowed={!buildButtonDisabled}
          reason={buildButtonTooltip}
        >
          <ChevronDown size={16} />
        </ButtonWithPermission>
      </ButtonGroup>
      <Popper id={id} sx={{ zIndex: 1 }} open={open} anchorEl={menuAnchorEl} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleCloseMenu}>
                <MenuList autoFocusItem>
                  <MenuItem
                    onClick={() => {
                      handleOpenGitLabParamsDialog();
                      handleCloseMenu();
                    }}
                  >
                    <ListItemIcon>
                      <Play size={25} />
                    </ListItemIcon>
                    <ListItemText>Build with params</ListItemText>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};
