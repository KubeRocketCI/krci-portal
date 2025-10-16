import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, k8sQuickLinkConfig, QuickLink, QuickLinkDraft } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const quickLinkCreateMutation = useResourceCRUDMutation<QuickLinkDraft, typeof k8sOperation.create>(
    "quickLinkCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Creating QuickLink",
        },
        error: {
          message: "Failed to create QuickLink",
        },
        success: {
          message: "QuickLink has been created",
          options: {
            duration: 8000,
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
        loading: {
          message: "Patching QuickLink",
        },
        error: {
          message: "Failed to patch QuickLink",
        },
        success: {
          message: "QuickLink has been patched",
          options: {
            duration: 8000,
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
        loading: {
          message: "Deleting QuickLink",
        },
        error: {
          message: "Failed to delete QuickLink",
        },
        success: {
          message: "QuickLink has been deleted",
          options: {
            duration: 8000,
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
