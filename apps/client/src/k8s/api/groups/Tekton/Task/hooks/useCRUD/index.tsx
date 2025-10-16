import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, k8sTaskConfig, Task, TaskDraft } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const taskCreateMutation = useResourceCRUDMutation<TaskDraft, typeof k8sOperation.create>(
    "taskCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Creating Task",
        },
        error: {
          message: "Failed to create Task",
        },
        success: {
          message: "Task has been created",
          options: {
            duration: 8000,
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
        loading: {
          message: "Patching Task",
        },
        error: {
          message: "Failed to patch Task",
        },
        success: {
          message: "Task has been patched",
          options: {
            duration: 8000,
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
        loading: {
          message: "Deleting Task",
        },
        error: {
          message: "Failed to delete Task",
        },
        success: {
          message: "Task has been deleted",
          options: {
            duration: 8000,
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
