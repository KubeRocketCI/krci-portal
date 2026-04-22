import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { showToast } from "@/core/components/Snackbar";
import EditorYAML from "@/core/components/EditorYAML";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useTRPCClient } from "@/core/providers/trpc";
import { router } from "@/core/router";
import { ListItemAction } from "@/core/types/global";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import {
  createRerunPipelineRun,
  getPipelineRunStatus,
  isHistoryPipelineRun,
  k8sOperation,
  normalizeHistoryPipelineRun,
  parseRecordName,
  PipelineRun,
  pipelineRunReason,
  pipelineRunSpecStatus,
} from "@my-project/shared";
import { OctagonX, Redo2, Trash } from "lucide-react";
import React from "react";
import { buildPipelineRunNameFilter, SINGLE_RECORD_LOOKUP_PAGE_SIZE } from "../../utils/celFilters";
import { CustomActionsInlineList } from "./components/CustomActionsInlineList";
import { PipelineRunActionsMenuProps } from "./types";

// History items from the list view lack spec/status details needed for rerun.
async function resolveFullPipelineRun(
  trpc: ReturnType<typeof useTRPCClient>,
  pipelineRun: PipelineRun
): Promise<PipelineRun> {
  if (!isHistoryPipelineRun(pipelineRun)) {
    return pipelineRun;
  }

  if (pipelineRun.spec?.pipelineSpec || pipelineRun.status?.childReferences) {
    return pipelineRun;
  }

  const namespace = pipelineRun.metadata.namespace;

  if (!namespace) {
    throw new Error("PipelineRun is missing namespace");
  }

  const name = pipelineRun.metadata.name;

  const searchResult = await trpc.tektonResults.listRecords.query({
    namespace,
    filter: buildPipelineRunNameFilter(name),
    pageSize: SINGLE_RECORD_LOOKUP_PAGE_SIZE,
    orderBy: "create_time desc",
  });

  const firstRecord = searchResult.records?.[0];
  const recordInfo = firstRecord?.name ? parseRecordName(firstRecord.name) : null;

  if (!recordInfo?.resultUid || !recordInfo?.recordUid) {
    throw new Error("PipelineRun record not found in Tekton Results");
  }

  const fullData = await trpc.tektonResults.getPipelineRun.query({
    namespace,
    resultUid: recordInfo.resultUid,
    recordUid: recordInfo.recordUid,
  });

  return normalizeHistoryPipelineRun(fullData.pipelineRun);
}

function handleResolveError(err: unknown) {
  console.error("resolveFullPipelineRun failed:", err);
  showToast("Failed to fetch PipelineRun data for rerun", "error", {
    description: err instanceof Error ? err.message : String(err),
  });
}

export const PipelineRunActionsMenu = ({
  backRoute,
  variant,
  data: { pipelineRun },
  hideStopAction,
}: PipelineRunActionsMenuProps) => {
  const pipelineRunPermissions = usePipelineRunPermissions();
  const trpc = useTRPCClient();

  const { triggerCreatePipelineRun, triggerDeletePipelineRun, triggerPatchPipelineRun } = usePipelineRunCRUD();

  const onDelete = React.useCallback(() => {
    if (!backRoute) {
      return;
    }

    router.navigate(backRoute);
  }, [backRoute]);

  const openEditorDialog = useDialogOpener(EditorYAML);

  const actions = React.useMemo(() => {
    if (!pipelineRun) {
      return [];
    }

    const isHistoryItem = isHistoryPipelineRun(pipelineRun);

    const status = getPipelineRunStatus(pipelineRun);
    const isInProgress = status.reason === pipelineRunReason.started || status.reason === pipelineRunReason.running;

    return [
      !hideStopAction && !isHistoryItem && isInProgress
        ? createResourceAction({
            type: k8sOperation.update,
            label: "Stop run",
            Icon: <OctagonX size={16} />,
            item: pipelineRun,
            disabled: {
              status: !pipelineRunPermissions.data.update.allowed,
              reason: pipelineRunPermissions.data.update.reason,
            },
            callback: (pipelineRun) => {
              const newPipelineRun = structuredClone(pipelineRun);
              newPipelineRun.spec.status = pipelineRunSpecStatus.Cancelled;
              triggerPatchPipelineRun({ data: { pipelineRun: newPipelineRun } });
            },
          })
        : undefined,
      createResourceAction({
        type: k8sOperation.create,
        label: "Run again",
        Icon: <Redo2 size={16} />,
        item: pipelineRun,
        disabled: {
          status: !pipelineRunPermissions.data.create.allowed,
          reason: pipelineRunPermissions.data.create.reason,
        },
        callback: (pipelineRun) => {
          resolveFullPipelineRun(trpc, pipelineRun)
            .then((fullPipelineRun) => {
              const newPipelineRun = createRerunPipelineRun(fullPipelineRun);

              triggerCreatePipelineRun({
                data: {
                  pipelineRun: newPipelineRun,
                },
              });
            })
            .catch(handleResolveError);
        },
      }),
      createResourceAction({
        type: k8sOperation.create,
        label: "Run with params",
        Icon: <Redo2 size={16} />,
        item: pipelineRun,
        disabled: {
          status: !pipelineRunPermissions.data.create.allowed,
          reason: pipelineRunPermissions.data.create.reason,
        },
        callback: (pipelineRun: PipelineRun) => {
          resolveFullPipelineRun(trpc, pipelineRun)
            .then((fullPipelineRun) => {
              const newPipelineRun = createRerunPipelineRun(fullPipelineRun);
              openEditorDialog({
                content: newPipelineRun,
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
            })
            .catch(handleResolveError);
        },
      }),
      isHistoryItem
        ? undefined
        : createResourceAction({
            type: k8sOperation.delete,
            label: capitalizeFirstLetter(k8sOperation.delete),
            Icon: <Trash size={16} />,
            item: pipelineRun,
            disabled: {
              status: !pipelineRunPermissions.data.delete.allowed,
              reason: pipelineRunPermissions.data.delete.reason,
            },
            callback: (pipelineRun) => {
              triggerDeletePipelineRun({ data: { pipelineRun: pipelineRun }, callbacks: { onSuccess: onDelete } });
            },
          }),
    ].filter((action): action is ListItemAction => action !== undefined);
  }, [
    pipelineRun,
    hideStopAction,
    trpc,
    pipelineRunPermissions.data.create.allowed,
    pipelineRunPermissions.data.create.reason,
    pipelineRunPermissions.data.update.allowed,
    pipelineRunPermissions.data.update.reason,
    pipelineRunPermissions.data.delete.allowed,
    pipelineRunPermissions.data.delete.reason,
    triggerCreatePipelineRun,
    triggerPatchPipelineRun,
    openEditorDialog,
    triggerDeletePipelineRun,
    onDelete,
  ]);

  const groupActions = actions.slice(0, 2);
  const inlineActions = actions.slice(2);

  return (
    <>
      {variant === actionMenuType.inline ? (
        <CustomActionsInlineList groupActions={groupActions} inlineActions={inlineActions} />
      ) : variant === actionMenuType.menu ? (
        <ActionsMenuList actions={actions} />
      ) : null}
    </>
  );
};
