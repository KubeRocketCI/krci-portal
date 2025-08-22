import { CopyButton } from "@/core/components/CopyButton";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { QuickLink } from "@/core/components/QuickLink";
import { StatusIcon } from "@/core/components/StatusIcon";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { getCodebaseBranchStatusIcon } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { useCodebaseWatch, useGitServerWatch } from "@/modules/platform/codebases/pages/details/hooks/data";
import { Box, Chip, Grid, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import {
  checkForKRCIVersioning,
  checkIsDefaultBranch,
  codebaseBranchStatus,
  getPipelineRunStatus,
} from "@my-project/shared";
import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import React from "react";
import { Actions } from "../Actions";
import { BuildGroup } from "../BuildGroup";
import { useStyles } from "./styles";
import { SummaryProps } from "./types";

export const Summary = ({
  codebaseBranch,
  latestBuildPipelineRun,
  handleOpenEditor,
  menuAnchorEl,
  handleClickMenu,
  handleCloseMenu,
}: SummaryProps) => {
  const theme = useTheme();

  const codebaseWatchQuery = useCodebaseWatch();
  const codebase = codebaseWatchQuery.query.data;

  const gitServerByCodebaseWatch = useGitServerWatch();

  const classes = useStyles();
  const status = codebaseBranch?.status?.status;
  const detailedMessage = codebaseBranch?.status?.detailedMessage;

  const codebaseBranchStatusIcon = getCodebaseBranchStatusIcon(codebaseBranch);
  const lastPipelineRunStatusIcon = getPipelineRunStatusIcon(latestBuildPipelineRun);

  const isKRCIVersioning = checkForKRCIVersioning(codebase?.spec.versioning.type);

  const { status: lastPipelineRunStatus, reason: lastPipelineRunReason } = getPipelineRunStatus(latestBuildPipelineRun);

  const gitRepoBranchLink = React.useMemo(() => {
    const gitProvider = gitServerByCodebaseWatch.query.data?.spec.gitProvider;

    if (!gitProvider || !codebase?.status?.gitWebUrl || !codebaseBranch?.spec.branchName) {
      return undefined;
    }

    return LinkCreationService.git.createRepoBranchLink(
      gitProvider,
      codebase?.status?.gitWebUrl,
      codebaseBranch?.spec.branchName
    );
  }, [
    codebase?.status?.gitWebUrl,
    codebaseBranch?.spec.branchName,
    gitServerByCodebaseWatch.query.data?.spec.gitProvider,
  ]);

  return (
    <>
      <Stack
        spacing={2}
        alignItems="center"
        direction="row"
        width={"100%"}
        justifyContent="space-between"
        flexWrap="nowrap"
      >
        <Stack spacing={2} alignItems="center" direction="row">
          <StatusIcon
            Icon={codebaseBranchStatusIcon.component}
            color={codebaseBranchStatusIcon.color}
            isSpinning={codebaseBranchStatusIcon.isSpinning}
            Title={
              <>
                <Typography variant={"subtitle2"} sx={{ fontWeight: 600 }}>
                  {`Status: ${status || "Unknown"}`}
                </Typography>
                {status === codebaseBranchStatus.failed && (
                  <Typography variant={"subtitle2"} sx={{ mt: (t) => t.typography.pxToRem(10) }}>
                    {detailedMessage}
                  </Typography>
                )}
              </>
            }
          />
          <Stack direction="row" alignItems="center" spacing={0}>
            <TextWithTooltip
              text={codebaseBranch.spec.branchName}
              textSX={{
                marginTop: theme.typography.pxToRem(2),
                fontSize: (t) => t.typography.pxToRem(20),
                fontWeight: 500,
              }}
            />
            <Box
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <CopyButton text={codebaseBranch.spec.branchName} size="small" />
            </Box>
          </Stack>

          {codebase && checkIsDefaultBranch(codebase, codebaseBranch) && (
            <Chip label="default" size="small" className={clsx([classes.labelChip, classes.labelChipBlue])} />
          )}
          {codebaseBranch.spec.release && (
            <Chip label="release" size="small" className={clsx([classes.labelChip, classes.labelChipGreen])} />
          )}
          {latestBuildPipelineRun && (
            <Stack spacing={1} alignItems="center" direction="row">
              <Typography fontSize={12}>Build status</Typography>
              <StatusIcon
                Icon={lastPipelineRunStatusIcon.component}
                color={lastPipelineRunStatusIcon.color}
                isSpinning={lastPipelineRunStatusIcon.isSpinning}
                Title={
                  <>
                    <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                      {`Last Build PipelineRun status: ${lastPipelineRunStatus}. Reason: ${lastPipelineRunReason}`}
                    </Typography>
                  </>
                }
              />
            </Stack>
          )}

          {isKRCIVersioning ? (
            <>
              <Stack spacing={1} alignItems="center" direction="row">
                <Typography fontSize={12}>Build:</Typography>
                <Chip label={codebaseBranch?.status?.build || "N/A"} size="small" />
              </Stack>
              <Stack spacing={1} alignItems="center" direction="row">
                <Typography fontSize={12}>Successful build:</Typography>
                <Chip label={codebaseBranch?.status?.lastSuccessfulBuild || "N/A"} size="small" />
              </Stack>
              <Stack spacing={1} alignItems="center" direction="row">
                <Typography fontSize={12}>Version:</Typography>
                <Tooltip title={codebaseBranch?.spec?.version || "N/A"}>
                  <Chip
                    label={codebaseBranch?.spec?.version || "N/A"}
                    sx={{
                      maxWidth: theme.typography.pxToRem(200),
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    size="small"
                  />
                </Tooltip>
              </Stack>
            </>
          ) : null}
        </Stack>

        <Box
          sx={{ pr: theme.typography.pxToRem(16), flexShrink: 0 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Grid container spacing={3} alignItems={"center"}>
            <Grid item>
              <QuickLink
                enabledText="Open in GIT"
                name={{ label: "GIT" }}
                Icon={<ExternalLink size={16} />}
                externalLink={gitRepoBranchLink}
                variant="text"
                isTextButton
              />
            </Grid>
            <Grid item>
              <BuildGroup
                menuAnchorEl={menuAnchorEl}
                handleClickMenu={handleClickMenu}
                handleCloseMenu={handleCloseMenu}
                handleOpenEditor={handleOpenEditor}
                codebaseBranch={codebaseBranch}
                latestBuildPipelineRun={latestBuildPipelineRun}
              />
            </Grid>

            <Grid item>
              <LoadingWrapper isLoading={codebaseWatchQuery.query.isLoading}>
                <Actions codebaseBranch={codebaseBranch} />
              </LoadingWrapper>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </>
  );
};
