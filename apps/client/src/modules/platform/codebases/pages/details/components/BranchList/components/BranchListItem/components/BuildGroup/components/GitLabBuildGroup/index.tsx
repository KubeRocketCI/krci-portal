import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { StatusIcon } from "@/core/components/StatusIcon";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import { ChevronDown, LoaderCircle, Play } from "lucide-react";
import { GitLabBuildGroupProps } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";

export const GitLabBuildGroup = ({
  codebaseBranch,
  handleOpenGitLabParamsDialog,
  handleDirectGitLabBuild,
  isGitLabLoading,
}: GitLabBuildGroupProps) => {
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
      <div className="flex">
        <ButtonWithPermission
          ButtonProps={{
            size: "sm",
            variant: "outline",
            onClick: handleDirectGitLabBuild,
            className: "rounded-r-none border-r-0 text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10",
          }}
          allowed={!buildButtonDisabled}
          reason={buildButtonTooltip}
        >
          {isGitLabLoading ? (
            <StatusIcon Icon={LoaderCircle} isSpinning color="#596D80" />
          ) : (
            <Play size={20} className="text-secondary-dark" />
          )}
          {isGitLabLoading ? "Building" : "Build"}
        </ButtonWithPermission>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={buildButtonDisabled}
              variant="outline"
              size="sm"
              className="text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10 rounded-l-none"
            >
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                handleOpenGitLabParamsDialog();
              }}
              className="flex items-center gap-2"
            >
              <Play size={25} />
              Build with params
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
