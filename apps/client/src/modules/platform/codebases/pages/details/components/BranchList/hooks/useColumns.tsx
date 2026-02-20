import { CopyButton } from "@/core/components/CopyButton";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { SavedTableSettings } from "@/core/components/Table/components/TableSettings/types";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { getCodebaseBranchStatusIcon } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { useClusterStore } from "@/k8s/store";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { useCodebaseWatch, useGitServerWatch } from "../../../hooks/data";
import { checkIsDefaultBranch, codebaseBranchStatus, getPipelineRunStatus } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { GitBranch, SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { Actions } from "../components/BranchListItem/components/Actions";
import { PipelineActionsGroup } from "../components/BranchListItem/components/PipelineActionsGroup";
import { columnNames } from "../constants";
import { EnrichedBranch } from "../types";

function formatBuildStatusText(reason: string): string {
  if (reason === "running") return "In progress";
  return reason.charAt(0).toUpperCase() + reason.slice(1);
}

function formatBranchStatusText(status: string | undefined): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
}

import type { BadgeProps } from "@/core/components/ui/badge";

const statusBadgeVariants: Record<string, BadgeProps["variant"]> = {
  [codebaseBranchStatus.created]: "success",
  [codebaseBranchStatus.failed]: "error",
  [codebaseBranchStatus.in_progress]: "info",
  [codebaseBranchStatus.initialized]: "warning",
};

function getStatusBadgeVariant(status: string | undefined): BadgeProps["variant"] {
  return (status && statusBadgeVariants[status]) || "neutral";
}

export const useColumns = ({
  tableSettings,
}: {
  tableSettings: SavedTableSettings | undefined;
}): TableColumn<EnrichedBranch>[] => {
  const codebaseWatchQuery = useCodebaseWatch();
  const codebase = codebaseWatchQuery.query.data;
  const gitServerByCodebaseWatch = useGitServerWatch();
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const gitProvider = gitServerByCodebaseWatch.query.data?.spec.gitProvider;
  const gitWebUrl = codebase?.status?.gitWebUrl;

  const gitDataRef = React.useRef({ gitProvider, gitWebUrl });
  gitDataRef.current = { gitProvider, gitWebUrl };

  const codebaseRef = React.useRef(codebase);
  codebaseRef.current = codebase;

  const getGitRepoBranchLink = React.useCallback((codebaseBranch: EnrichedBranch["codebaseBranch"]) => {
    const { gitProvider: gp, gitWebUrl: url } = gitDataRef.current;
    if (!gp || !url || !codebaseBranch?.spec.branchName) return undefined;
    return LinkCreationService.git.createRepoBranchLink(gp, url, codebaseBranch?.spec.branchName);
  }, []);

  return React.useMemo(() => {
    return [
      {
        id: columnNames.BRANCH,
        label: "Branch",
        data: {
          columnSortableValuePath: "codebaseBranch.spec.branchName",
          render: ({ data }) => {
            const { codebaseBranch } = data;
            const gitLink = getGitRepoBranchLink(codebaseBranch);
            return (
              <div>
                <div className="flex flex-wrap items-center">
                  <div className="flex items-center gap-1">
                    <GitBranch className="text-muted-foreground h-4 w-4 shrink-0" />
                    {gitLink ? (
                      <a
                        href={gitLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TextWithTooltip text={codebaseBranch.spec.branchName} />
                        <SquareArrowOutUpRight className="text-primary shrink-0" size={14} />
                      </a>
                    ) : (
                      <TextWithTooltip text={codebaseBranch.spec.branchName} className="text-sm" />
                    )}
                  </div>
                  <CopyButton text={codebaseBranch.spec.branchName} size="small" />
                  {codebaseRef.current && checkIsDefaultBranch(codebaseRef.current, codebaseBranch) && (
                    <Badge variant="info" className="h-5 text-xs">
                      Default
                    </Badge>
                  )}
                  {codebaseBranch.spec.release && (
                    <Badge variant="success" className="h-5 text-xs">
                      Release
                    </Badge>
                  )}
                </div>
              </div>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 20,
          ...getSyncedColumnData(tableSettings, columnNames.BRANCH),
        },
      },
      {
        id: columnNames.STATUS,
        label: "Status",
        data: {
          columnSortableValuePath: "codebaseBranch.status.status",
          render: ({ data }) => {
            const { codebaseBranch } = data;
            const status = codebaseBranch?.status?.status;
            const detailedMessage = codebaseBranch?.status?.detailedMessage;
            const codebaseBranchStatusIcon = getCodebaseBranchStatusIcon(codebaseBranch);
            const statusText = formatBranchStatusText(status);
            const badgeVariant = getStatusBadgeVariant(status);
            return (
              <Badge variant={badgeVariant} className="gap-1">
                <StatusIcon
                  Icon={codebaseBranchStatusIcon.component}
                  color="currentColor"
                  isSpinning={codebaseBranchStatusIcon.isSpinning}
                  width={12}
                  Title={
                    <>
                      <p className="text-sm font-semibold">{`Status: ${status || "Unknown"}`}</p>
                      {status === codebaseBranchStatus.failed && detailedMessage && (
                        <p className="mt-3 text-sm font-medium">{detailedMessage}</p>
                      )}
                    </>
                  }
                />
                {statusText}
              </Badge>
            );
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.STATUS),
        },
      },
      {
        id: columnNames.LAST_BUILD,
        label: "Last build",
        data: {
          render: ({ data }) => {
            const { codebaseBranch } = data;
            const total = codebaseBranch?.status?.build;
            const successful = codebaseBranch?.status?.lastSuccessfulBuild;
            const hasMeaningfulBuildCount =
              (total != null && Number(total) > 0) || (successful != null && Number(successful) > 0);

            const pr = data.latestBuildPipelineRun;
            if (!pr) {
              if (hasMeaningfulBuildCount) {
                return (
                  <div className="text-muted-foreground text-sm">
                    Build: {total ?? "—"} / {successful ?? "—"} successful
                  </div>
                );
              }
              return <span className="text-muted-foreground text-sm">No builds</span>;
            }
            const icon = getPipelineRunStatusIcon(pr);
            const { reason } = getPipelineRunStatus(pr);
            const statusText = formatBuildStatusText(reason);
            const { name, namespace, creationTimestamp } = pr.metadata;
            const buildTime = creationTimestamp ? new Date(creationTimestamp).toLocaleString() : null;
            return (
              <div className="flex items-start gap-1.5">
                <div className="shrink-0 pt-0.5">
                  <StatusIcon
                    Icon={icon.component}
                    color={icon.color}
                    isSpinning={icon.isSpinning}
                    width={14}
                    Title={statusText}
                  />
                </div>
                <div className="min-w-0">
                  <Button variant="link" asChild className="h-auto p-0 text-sm font-medium whitespace-normal">
                    <Link
                      to={PATH_PIPELINERUN_DETAILS_FULL}
                      params={{
                        clusterName,
                        namespace: namespace || defaultNamespace,
                        name,
                      }}
                    >
                      <TextWithTooltip text={name} />
                    </Link>
                  </Button>
                  {buildTime && <span className="text-muted-foreground block text-xs">{buildTime}</span>}
                  {hasMeaningfulBuildCount && (
                    <span className="text-muted-foreground block text-xs">
                      Build: {total ?? "—"} / {successful ?? "—"} successful
                    </span>
                  )}
                </div>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 20,
          ...getSyncedColumnData(tableSettings, columnNames.LAST_BUILD),
        },
      },
      {
        id: columnNames.VERSION,
        label: "Version",
        data: {
          columnSortableValuePath: "codebaseBranch.spec.version",
          render: ({ data }) => {
            const version = data.codebaseBranch?.spec?.version ?? "—";
            return <TextWithTooltip text={String(version)} className="text-muted-foreground text-sm" />;
          },
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, columnNames.VERSION),
        },
      },
      {
        id: columnNames.BUILD,
        label: "Build",
        data: {
          render: ({ data }) => (
            <div onClick={(e) => e.stopPropagation()}>
              <PipelineActionsGroup
                codebaseBranch={data.codebaseBranch}
                latestBuildPipelineRun={data.latestBuildPipelineRun}
                latestSecurityPipelineRun={data.latestSecurityPipelineRun}
              />
            </div>
          ),
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.BUILD),
        },
      },
      {
        id: columnNames.ACTIONS,
        label: "Actions",
        data: {
          render: ({ data }) => (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <LoadingWrapper isLoading={codebaseWatchQuery.query.isLoading}>
                <Actions codebaseBranch={data.codebaseBranch} />
              </LoadingWrapper>
            </div>
          ),
        },
        cell: {
          baseWidth: 6,
          isFixed: true,
          ...getSyncedColumnData(tableSettings, columnNames.ACTIONS),
        },
      },
    ];
  }, [codebaseWatchQuery.query.isLoading, clusterName, defaultNamespace, tableSettings, getGitRepoBranchLink]);
};
