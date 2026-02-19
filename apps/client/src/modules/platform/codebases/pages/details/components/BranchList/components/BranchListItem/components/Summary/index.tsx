import { CopyButton } from "@/core/components/CopyButton";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { QuickLink } from "@/core/components/QuickLink";
import { StatusIcon } from "@/core/components/StatusIcon";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { getCodebaseBranchStatusIcon } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { useCodebaseWatch, useGitServerWatch } from "@/modules/platform/codebases/pages/details/hooks/data";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import {
  checkForKRCIVersioning,
  checkIsDefaultBranch,
  codebaseBranchStatus,
  getPipelineRunStatus,
} from "@my-project/shared";
import { ExternalLink } from "lucide-react";
import React from "react";
import { Actions } from "../Actions";
import { PipelineActionsGroup } from "../PipelineActionsGroup";
import { SummaryProps } from "./types";

export function Summary({ codebaseBranch, latestBuildPipelineRun, latestSecurityPipelineRun }: SummaryProps) {
  const codebaseWatchQuery = useCodebaseWatch();
  const codebase = codebaseWatchQuery.query.data;

  const gitServerByCodebaseWatch = useGitServerWatch();

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
      <div className="flex w-full flex-nowrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusIcon
            Icon={codebaseBranchStatusIcon.component}
            color={codebaseBranchStatusIcon.color}
            isSpinning={codebaseBranchStatusIcon.isSpinning}
            Title={
              <>
                <p className="text-sm font-semibold">{`Status: ${status || "Unknown"}`}</p>
                {status === codebaseBranchStatus.failed && (
                  <p className="mt-3 text-sm font-medium">{detailedMessage}</p>
                )}
              </>
            }
          />
          <div className="flex items-center gap-0">
            <TextWithTooltip text={codebaseBranch.spec.branchName} className="mt-0.5 text-lg font-medium" />
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <CopyButton text={codebaseBranch.spec.branchName} size="small" />
            </div>
          </div>

          {codebase && checkIsDefaultBranch(codebase, codebaseBranch) && (
            <Badge variant="info" className="h-6">
              default
            </Badge>
          )}
          {codebaseBranch.spec.release && (
            <Badge variant="success" className="h-6">
              release
            </Badge>
          )}
          {latestBuildPipelineRun && (
            <div className="flex items-center gap-1">
              <span className="text-xs">Build status</span>
              <StatusIcon
                Icon={lastPipelineRunStatusIcon.component}
                color={lastPipelineRunStatusIcon.color}
                isSpinning={lastPipelineRunStatusIcon.isSpinning}
                Title={
                  <>
                    <p className="text-sm font-semibold">
                      {`Last Build PipelineRun status: ${lastPipelineRunStatus}. Reason: ${lastPipelineRunReason}`}
                    </p>
                  </>
                }
              />
            </div>
          )}

          {isKRCIVersioning ? (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xs">Build:</span>
                <Badge variant="secondary">{codebaseBranch?.status?.build || "N/A"}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">Successful build:</span>
                <Badge variant="secondary">{codebaseBranch?.status?.lastSuccessfulBuild || "N/A"}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">Version:</span>
                <Tooltip title={codebaseBranch?.spec?.version || "N/A"}>
                  <Badge variant="secondary" className="max-w-[200px] truncate">
                    {codebaseBranch?.spec?.version || "N/A"}
                  </Badge>
                </Tooltip>
              </div>
            </>
          ) : null}
        </div>

        <div
          className="shrink-0 pr-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex items-center gap-3">
            <div>
              <QuickLink
                enabledText="Open in GIT"
                name={{ label: "GIT" }}
                Icon={<ExternalLink size={16} />}
                externalLink={gitRepoBranchLink}
                variant="ghost"
                isTextButton
              />
            </div>
            <div>
              <PipelineActionsGroup
                codebaseBranch={codebaseBranch}
                latestBuildPipelineRun={latestBuildPipelineRun}
                latestSecurityPipelineRun={latestSecurityPipelineRun}
              />
            </div>

            <div>
              <LoadingWrapper isLoading={codebaseWatchQuery.query.isLoading}>
                <Actions codebaseBranch={codebaseBranch} />
              </LoadingWrapper>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
