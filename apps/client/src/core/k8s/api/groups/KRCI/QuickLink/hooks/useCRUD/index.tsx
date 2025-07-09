import { Snackbar } from "@/core/components/Snackbar";
import { useResourceCRUDMutation } from "@/core/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, k8sQuickLinkConfig, QuickLink, QuickLinkDraft } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const quickLinkCreateMutation = useResourceCRUDMutation<QuickLinkDraft, typeof k8sOperation.create>(
    "quickLinkCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Creating QuickLink",
        },
        onError: {
          message: "Failed to create QuickLink",
        },
        onSuccess: {
          message: "QuickLink has been created",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const quickLinkPatchMutation = useResourceCRUDMutation<QuickLinkDraft, typeof k8sOperation.patch>(
    "quickLinkPatchMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Patching QuickLink",
        },
        onError: {
          message: "Failed to patch QuickLink",
        },
        onSuccess: {
          message: "QuickLink has been patched",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const quickLinkDeleteMutation = useResourceCRUDMutation<QuickLinkDraft, typeof k8sOperation.delete>(
    "quickLinkDeleteMutation",
    k8sOperation.delete,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Deleting QuickLink",
        },
        onError: {
          message: "Failed to delete QuickLink",
        },
        onSuccess: {
          message: "QuickLink has been deleted",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
          },
        },
      }),
    }
  );

  const triggerCreateQuickLink = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        quickLink: QuickLinkDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { quickLink } = data;

      quickLinkCreateMutation.mutate(
        {
          resource: quickLink,
          resourceConfig: k8sQuickLinkConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [quickLinkCreateMutation]
  );

  const triggerPatchQuickLink = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        quickLink: QuickLink;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { quickLink } = data;

      quickLinkPatchMutation.mutate(
        {
          resource: quickLink,
          resourceConfig: k8sQuickLinkConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [quickLinkPatchMutation]
  );

  const triggerDeleteQuickLink = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        quickLink: QuickLink;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { quickLink } = data;

      quickLinkDeleteMutation.mutate(
        {
          resource: quickLink,
          resourceConfig: k8sQuickLinkConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [quickLinkDeleteMutation]
  );

  const mutations = {
    quickLinkCreateMutation,
    quickLinkPatchMutation,
    quickLinkDeleteMutation,
  };

  return { triggerCreateQuickLink, triggerPatchQuickLink, triggerDeleteQuickLink, mutations };
};
