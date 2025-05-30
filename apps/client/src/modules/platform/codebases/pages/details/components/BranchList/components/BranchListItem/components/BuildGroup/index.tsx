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
import React from "react";

import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useTriggerTemplateWatchItem } from "@/core/k8s/api/groups/Tekton/TriggerTemplate";
import { CUSTOM_RESOURCE_STATUS } from "@/core/k8s/constants/statuses";
import { BuildGroupProps } from "./types";
import { useDataContext } from "@/modules/platform/codebases/pages/details/providers/Data/hooks";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/core/k8s/api/groups/Tekton/PipelineRun";
import { createBuildPipelineRunDraft, getPipelineRunStatus, pipelineRunReason } from "@my-project/shared";
import { ArrowDown, LoaderCircle, Play } from "lucide-react";

export const BuildGroup = ({
  codebaseBranch,
  latestBuildPipelineRun,
  handleOpenEditor,
  menuAnchorEl,
  handleClickMenu,
  handleCloseMenu,
}: BuildGroupProps) => {
  const { gitServerByCodebaseWatch, codebaseWatch } = useDataContext();

  const codebase = codebaseWatch.data;
  const gitServerByCodebase = gitServerByCodebaseWatch.data;

  const open = Boolean(menuAnchorEl);
  const id = open ? "simple-popper" : undefined;

  const theme = useTheme();

  const buildTriggerTemplateWatch = useTriggerTemplateWatchItem({
    name: `${gitServerByCodebase?.spec?.gitProvider}-build-template`,
    queryOptions: {
      enabled: !!gitServerByCodebase?.spec?.gitProvider,
    },
  });

  const pipelineRunPermissions = usePipelineRunPermissions();

  const buildTriggerTemplate = buildTriggerTemplateWatch.data;

  const { createPipelineRun } = usePipelineRunCRUD();

  const buildPipelineRunData = React.useMemo(() => {
    if (!gitServerByCodebase || !codebase) {
      return;
    }

    const buildPipelineRunTemplate = buildTriggerTemplate?.spec?.resourcetemplates?.[0];

    if (!buildPipelineRunTemplate) {
      return;
    }

    const buildPipelineRunTemplateCopy = structuredClone(buildPipelineRunTemplate);

    return createBuildPipelineRunDraft({
      codebase,
      codebaseBranch,
      pipelineRunTemplate: buildPipelineRunTemplateCopy,
      gitServer: gitServerByCodebase,
    });
  }, [buildTriggerTemplate?.spec?.resourcetemplates, codebase, codebaseBranch, gitServerByCodebase]);

  const onBuildButtonClick = React.useCallback(async () => {
    if (!buildPipelineRunData) {
      return;
    }

    await createPipelineRun({
      pipelineRun: buildPipelineRunData,
    });
  }, [buildPipelineRunData, createPipelineRun]);

  const latestBuildStatus = getPipelineRunStatus(latestBuildPipelineRun);

  const latestBuildIsRunning = latestBuildStatus.reason === pipelineRunReason.running;

  const codebaseBranchStatusIsOk = codebaseBranch?.status?.status === CUSTOM_RESOURCE_STATUS.CREATED;

  const buildButtonDisabled =
    !pipelineRunPermissions.data.create.allowed || latestBuildIsRunning || !codebaseBranchStatusIsOk;

  const buildButtonTooltip = (() => {
    if (!pipelineRunPermissions.data.create.allowed) {
      return pipelineRunPermissions.data.create.reason;
    }

    if (latestBuildIsRunning) {
      return "Latest build PipelineRun is running";
    }

    if (!codebaseBranchStatusIsOk) {
      return `Codebase branch status is ${codebaseBranch?.status?.status}`;
    }

    return "Trigger build PipelineRun";
  })();

  return (
    <>
      <ButtonGroup variant="outlined" sx={{ color: theme.palette.text.primary }}>
        <ButtonWithPermission
          ButtonProps={{
            startIcon: latestBuildIsRunning ? <LoaderCircle size={20} /> : <Play size={20} />,
            onClick: onBuildButtonClick,
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
          {latestBuildIsRunning ? "building" : "build"}
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
          <ArrowDown size={15} />
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
                      if (!buildPipelineRunData) {
                        return;
                      }

                      handleOpenEditor(buildPipelineRunData);
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
