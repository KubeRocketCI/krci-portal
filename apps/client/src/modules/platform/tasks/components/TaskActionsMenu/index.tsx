import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { useTaskCRUD, useTaskPermissions } from "@/k8s/api/groups/Tekton/Task";
import { Edit } from "lucide-react";
import React from "react";
import { TaskActionsMenuProps } from "./types";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { k8sOperation, Task } from "@my-project/shared";
import EditorYAML from "@/core/components/EditorYAML";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";

export const TaskActionsMenu: React.FC<TaskActionsMenuProps> = ({
  variant,
  data: { task },
}) => {
  const taskPermissions = useTaskPermissions();
  const { triggerPatchTask } = useTaskCRUD();
  const openEditorDialog = useDialogOpener(EditorYAML);

  const actions = React.useMemo(() => {
    if (!task) {
      return [];
    }

    return [
      createResourceAction({
        type: k8sOperation.patch,
        label: "Edit",
        Icon: <Edit size={16} />,
        item: task,
        disabled: {
          status: !taskPermissions.data.patch.allowed,
          reason: taskPermissions.data.patch.reason,
        },
        callback: (task: Task) => {
          openEditorDialog({
            content: task,
            onSave: (_yaml, json) => {
              if (!json) {
                return;
              }

              triggerPatchTask({
                data: {
                  task: json as Task,
                },
              });
            },
          });
        },
      }),
    ];
  }, [
    task,
    taskPermissions.data.patch.allowed,
    taskPermissions.data.patch.reason,
    openEditorDialog,
    triggerPatchTask,
  ]);

  return (
    <>
      {variant === actionMenuType.inline ? (
        <ActionsInlineList actions={actions} />
      ) : variant === actionMenuType.menu ? (
        <ActionsMenuList actions={actions} />
      ) : null}
    </>
  );
};
