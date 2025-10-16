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
import { StatusIcon } from "@/core/components/StatusIcon";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import {
  useBuildTriggerTemplateWatch,
  useCodebaseWatch,
  useGitServerWatch,
} from "@/modules/platform/codebases/pages/details/hooks/data";
import { createBuildPipelineRunDraft, getPipelineRunStatus, PipelineRun, pipelineRunReason } from "@my-project/shared";
import { ChevronDown, LoaderCircle, Play } from "lucide-react";
import { TektonBuildGroupProps } from "./types";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import EditorYAML from "@/core/components/EditorYAML";

export const TektonBuildGroup = ({
  codebaseBranch,
  latestBuildPipelineRun,
  menuAnchorEl,
  handleClickMenu,
  handleCloseMenu,
}: TektonBuildGroupProps) => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const gitServerByCodebaseWatch = useGitServerWatch();
  const gitServerByCodebase = gitServerByCodebaseWatch.query.data;

  const open = Boolean(menuAnchorEl);
  const id = open ? "simple-popper" : undefined;

  const theme = useTheme();

  const buildTriggerTemplateWatch = useBuildTriggerTemplateWatch();

  const pipelineRunPermissions = usePipelineRunPermissions();

  const buildTriggerTemplate = buildTriggerTemplateWatch.query.data;

  const { triggerCreatePipelineRun } = usePipelineRunCRUD();
  const openEditorDialog = useDialogOpener(EditorYAML);

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

    await triggerCreatePipelineRun({
      data: {
        pipelineRun: buildPipelineRunData,
      },
    });
  }, [buildPipelineRunData, triggerCreatePipelineRun]);

  const latestBuildStatus = getPipelineRunStatus(latestBuildPipelineRun || ({} as PipelineRun));

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
            startIcon: latestBuildIsRunning ? (
              <StatusIcon Icon={LoaderCircle} isSpinning color={theme.palette.secondary.dark} />
            ) : (
              <Play size={20} />
            ),
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
                      if (!buildPipelineRunData) {
                        return;
                      }

                      openEditorDialog({
                        content: buildPipelineRunData,
                        onSave: (_yaml, json) => {
                          if (!json) {
                            return;
                          }

                          triggerCreatePipelineRun({
                            data: {
                              pipelineRun: json as PipelineRun,
                            },
                          });
                        },
                      });

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
