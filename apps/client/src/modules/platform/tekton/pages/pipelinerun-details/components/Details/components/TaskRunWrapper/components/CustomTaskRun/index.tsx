import { useCustomRunWatchItem } from "@/k8s/api/groups/Tekton/CustomRun";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { humanize } from "@/core/utils/date-humanize";
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
import { CheckLine, MessageSquareMore, XCircle, Timer, Clock } from "lucide-react";
import React from "react";
import { ChoiceButtonGroup } from "./components/ChoiceButtonGroup";
import { CommentDialog } from "./components/CommentDialog";
import { useTabs } from "./hooks/useTabs";
import { CustomTaskRunProps } from "./types";
import { useAuth } from "@/core/auth/provider";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getApprovalTaskStatusIcon } from "@/k8s/api/groups/KRCI/ApprovalTask";

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

  const approvalTaskStatusIcon = getApprovalTaskStatusIcon(approvalTask);

  const completionTime = customTaskRun?.status?.completionTime || "";
  const startTime = customTaskRun?.status?.startTime || "";

  const endTime = completionTime || new Date().toISOString();

  const duration = startTime
    ? humanize(new Date(endTime).getTime() - new Date(startTime).getTime(), {
        language: "en-mini",
        spacer: "",
        delimiter: " ",
        fallbacks: ["en"],
        largest: 2,
        round: true,
        units: ["d", "h", "m", "s"],
      })
    : null;

  const startedAt = startTime
    ? new Date(startTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : null;

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
    <Card className="flex h-full flex-col">
      {/* Task header */}
      <div className="border-b px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon
              Icon={approvalTaskStatusIcon.component}
              color={approvalTaskStatusIcon.color}
              isSpinning={approvalTaskStatusIcon.isSpinning}
              width={20}
            />
            <div>
              <h3 className="text-foreground text-lg font-medium">Task: {taskRunName}</h3>
              {taskDescription && <p className="text-muted-foreground mt-0.5 text-sm">{taskDescription}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <ChoiceButtonGroup options={approveOptions} type="accept" />
                <ChoiceButtonGroup options={rejectOptions} type="reject" />
              </>
            )}
            <Badge variant="outline" className="text-sm">
              {taskRunStatus?.reason || approvalTask?.spec?.action}
            </Badge>
          </div>
        </div>

        {/* Task metadata */}
        <div className="flex items-center gap-6">
          {startedAt && (
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground text-sm">Started: {startedAt}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-2">
              <Timer className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground text-sm">Duration: {duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs content */}
      <div className="flex flex-1 flex-col p-4">
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </div>
    </Card>
  );
};
