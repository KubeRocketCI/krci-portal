import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { ApplicationDraft, k8sOperation, k8sApplicationConfig } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const applicationCreateMutation = useResourceCRUDMutation<ApplicationDraft, typeof k8sOperation.create>(
    "applicationCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Creating Application",
        },
        error: {
          message: "Failed to create Application",
        },
        success: {
          message: "Application has been created",
          options: {
            duration: 8000,
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
        loading: {
          message: "Patching Application",
        },
        error: {
          message: "Failed to patch Application",
        },
        success: {
          message: "Application has been patched",
          options: {
            duration: 8000,
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
        loading: {
          message: "Deleting Application",
        },
        error: {
          message: "Failed to delete Application",
        },
        success: {
          message: "Application has been deleted",
          options: {
            duration: 8000,
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
