import { Snackbar } from "@/core/components/Snackbar";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, k8sTaskConfig, Task, TaskDraft } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const taskCreateMutation = useResourceCRUDMutation<TaskDraft, typeof k8sOperation.create>(
    "taskCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Creating Task",
        },
        onError: {
          message: "Failed to create Task",
        },
        onSuccess: {
          message: "Task has been created",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const taskPatchMutation = useResourceCRUDMutation<TaskDraft, typeof k8sOperation.patch>(
    "taskPatchMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Patching Task",
        },
        onError: {
          message: "Failed to patch Task",
        },
        onSuccess: {
          message: "Task has been patched",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const taskDeleteMutation = useResourceCRUDMutation<TaskDraft, typeof k8sOperation.delete>(
    "taskDeleteMutation",
    k8sOperation.delete,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Deleting Task",
        },
        onError: {
          message: "Failed to delete Task",
        },
        onSuccess: {
          message: "Task has been deleted",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const triggerCreateTask = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        task: TaskDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { task } = data;

      taskCreateMutation.mutate(
        {
          resource: task,
          resourceConfig: k8sTaskConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [taskCreateMutation]
  );

  const triggerPatchTask = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        task: Task;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { task } = data;

      taskPatchMutation.mutate(
        {
          resource: task,
          resourceConfig: k8sTaskConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [taskPatchMutation]
  );

  const triggerDeleteTask = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        task: Task;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { task } = data;

      taskDeleteMutation.mutate(
        {
          resource: task,
          resourceConfig: k8sTaskConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [taskDeleteMutation]
  );

  const mutations = {
    taskCreateMutation,
    taskPatchMutation,
    taskDeleteMutation,
  };

  return { triggerCreateTask, triggerPatchTask, triggerDeleteTask, mutations };
};
