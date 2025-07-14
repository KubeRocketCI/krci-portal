import { Snackbar } from "@/core/components/Snackbar";
import { useResourceCRUDMutation } from "@/core/k8s/api/hooks/useResourceCRUDMutation";
import { ApplicationDraft, k8sOperation, k8sApplicationConfig } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const applicationCreateMutation = useResourceCRUDMutation<ApplicationDraft, typeof k8sOperation.create>(
    "applicationCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Creating Application",
        },
        onError: {
          message: "Failed to create Application",
        },
        onSuccess: {
          message: "Application has been created",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const applicationEditMutation = useResourceCRUDMutation<ApplicationDraft, typeof k8sOperation.patch>(
    "applicationEditMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Patching Application",
        },
        onError: {
          message: "Failed to patch Application",
        },
        onSuccess: {
          message: "Application has been patched",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const applicationDeleteMutation = useResourceCRUDMutation<ApplicationDraft, typeof k8sOperation.delete>(
    "applicationDeleteMutation",
    k8sOperation.delete,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Deleting Application",
        },
        onError: {
          message: "Failed to delete Application",
        },
        onSuccess: {
          message: "Application has been deleted",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const triggerCreateApplication = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        application: ApplicationDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { application } = data;

      applicationCreateMutation.mutate(
        {
          resource: application,
          resourceConfig: k8sApplicationConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [applicationCreateMutation]
  );

  const triggerEditApplication = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        application: ApplicationDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { application } = data;

      applicationEditMutation.mutate(
        {
          resource: application,
          resourceConfig: k8sApplicationConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [applicationEditMutation]
  );

  const triggerDeleteApplication = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        application: ApplicationDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { application } = data;

      applicationDeleteMutation.mutate(
        {
          resource: application,
          resourceConfig: k8sApplicationConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [applicationDeleteMutation]
  );

  const mutations = {
    applicationCreateMutation,
    applicationEditMutation,
    applicationDeleteMutation,
  };

  return { triggerCreateApplication, triggerEditApplication, triggerDeleteApplication, mutations };
};
