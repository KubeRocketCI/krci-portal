import { useCustomRunWatchItem } from "@/k8s/api/groups/Tekton/CustomRun";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { humanize } from "@/core/utils/date-humanize";
import { Divider, Paper } from "@mui/material";
import {
  ApprovalTask,
  ApprovalTaskAction,
  approvalTaskAction,
  getTaskRunStatus,
  k8sApprovalTaskConfig,
  k8sOperation,
  TaskRun,
  taskRunLabels,
} from "@my-project/shared";
import { CheckLine, MessageSquareMore, XCircle } from "lucide-react";
import React from "react";
import { StyledDetailsBody, StyledDetailsHeader } from "../../../../styles";
import { ChoiceButtonGroup } from "./components/ChoiceButtonGroup";
import { CommentDialog } from "./components/CommentDialog";
import { useTabs } from "./hooks/useTabs";
import { CustomTaskRunProps } from "./types";
import { useAuth } from "@/core/auth/provider";

const updateApprovalTask = ({
  approvalTask,
  action,
  approvedBy,
  comment,
}: {
  approvalTask: ApprovalTask;
  action: ApprovalTaskAction;
  approvedBy: string;
  comment?: string;
}) => {
  const updatedApprovalTask = {
    ...approvalTask,
    spec: {
      ...approvalTask.spec,
      action,
      approve: {
        approvedBy,
        comment,
      },
    },
  };

  return updatedApprovalTask;
};

export const CustomTaskRun = ({ pipelineRunTaskData }: CustomTaskRunProps) => {
  const { approvalTask } = pipelineRunTaskData;

  const isPending = approvalTask?.spec?.action === "Pending";

  const taskRunMetadataName = approvalTask?.metadata?.ownerReferences?.[0]?.name;

  const customTaskRunWatch = useCustomRunWatchItem({
    name: taskRunMetadataName!,
    namespace: approvalTask?.metadata?.namespace,
    queryOptions: {
      enabled: !!taskRunMetadataName && !!approvalTask?.metadata?.namespace,
    },
  });

  const customTaskRun = customTaskRunWatch.query.data;

  const taskRunName = customTaskRun?.metadata?.labels?.[taskRunLabels.pipelineTask];

  const taskRunStatus = customTaskRun
    ? getTaskRunStatus(customTaskRun as TaskRun)
    : { status: "Unknown", reason: "Unknown" };

  const completionTime = customTaskRun?.status?.completionTime || "";
  const startTime = customTaskRun?.status?.startTime || "";

  const endTime = completionTime || new Date().toISOString();

  const duration = humanize(new Date(endTime).getTime() - new Date(startTime).getTime(), {
    language: "en-mini",
    spacer: "",
    delimiter: " ",
    fallbacks: ["en"],
    largest: 2,
    round: true,
    units: ["d", "h", "m", "s"],
  });

  const tabs = useTabs({ taskRun: customTaskRun });

  const approvalTaskEditMutation = useResourceCRUDMutation<ApprovalTask, typeof k8sOperation.patch>(
    "approvalTaskEditMutation",
    k8sOperation.patch
  );

  const { user } = useAuth();

  const handleClickApproveOrReject = React.useCallback(
    (action: ApprovalTaskAction, comment?: string) => {
      const updatedApprovalTask = updateApprovalTask({
        approvalTask,
        approvedBy: user?.email || "dev",
        comment,
        action,
      });

      approvalTaskEditMutation.mutate({
        resource: updatedApprovalTask,
        resourceConfig: k8sApprovalTaskConfig,
      });
    },
    [approvalTask, approvalTaskEditMutation, user?.email]
  );

  const { setDialog } = useDialogContext();

  const approveOptions = React.useMemo(
    () => [
      {
        id: "approve",
        Icon: <CheckLine size={20} />,
        label: "Approve",
        onClick: () => handleClickApproveOrReject(approvalTaskAction.Approved),
      },
      {
        id: "approveWithComment",
        Icon: <MessageSquareMore size={20} />,
        label: "Approve with comment",
        onClick: () => {
          setDialog(CommentDialog, {
            title: "Approve with comment",
            onFormSubmit: (comment: string) => {
              handleClickApproveOrReject(approvalTaskAction.Approved, comment);
            },
          });
        },
      },
    ],
    [handleClickApproveOrReject, setDialog]
  );

  const rejectOptions = React.useMemo(
    () => [
      {
        id: "reject",
        Icon: <XCircle size={20} />,
        label: "Reject",
        onClick: () => handleClickApproveOrReject(approvalTaskAction.Rejected),
      },
      {
        id: "rejectWithComment",
        Icon: <MessageSquareMore size={20} />,
        label: "Reject with comment",
        onClick: () => {
          setDialog(CommentDialog, {
            title: "Reject with comment",
            onFormSubmit: (comment: string) => {
              handleClickApproveOrReject(approvalTaskAction.Rejected, comment);
            },
          });
        },
      },
    ],
    [handleClickApproveOrReject, setDialog]
  );

  const taskDescription = pipelineRunTaskData.task?.spec?.description || "";

  const { activeTab, handleChangeTab } = useTabsContext();

  return (
    <Paper>
      <StyledDetailsHeader>
        <div className="flex justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-medium">
                {taskRunName}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                Status:{" "}
                <span className="text-sm text-muted-foreground">
                  {taskRunStatus?.reason}
                </span>
              </span>
              <span className="text-sm font-medium text-foreground">
                Duration:{" "}
                <span className="text-sm text-muted-foreground">
                  {duration}
                </span>
              </span>
          </div>
          {taskDescription && (
              <span className="text-sm font-medium text-foreground">
                Description:{" "}
                <span className="text-sm text-muted-foreground">
                  {taskDescription}
                </span>
              </span>
            )}
          </div>
          {isPending && (
            <div className="flex items-center gap-2">
              <ChoiceButtonGroup options={approveOptions} type="accept" />
              <ChoiceButtonGroup options={rejectOptions} type="reject" />
            </div>
          )}
        </div>
      </StyledDetailsHeader>
      <Divider orientation="horizontal" />
      <StyledDetailsBody>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </StyledDetailsBody>
    </Paper>
  );
};
