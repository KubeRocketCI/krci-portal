import { trpc } from "@/core/clients/trpc";
import { Snackbar } from "@/core/components/Snackbar";
import { useClusterStore } from "@/core/store";
import { K8sOperation, k8sOperation, K8sResourceConfig, KubeObjectDraft } from "@my-project/shared";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { OptionsObject, SnackbarKey, SnackbarMessage, VariantType } from "notistack";
import { useShallow } from "zustand/react/shallow";
import { useRequestStatusMessages } from "../useResourceRequestStatusMessages";

type UseResourceCRUDMutationReturnType<
  KubeObjectData,
  Operation extends K8sOperation,
> = Operation extends typeof k8sOperation.delete ? void : KubeObjectData;

interface Message {
  message: string;
  options?: OptionsObject;
}

type CustomMessages = {
  onMutate?: Message;
  onError?: Message;
  onSuccess?: Message;
};

export interface UseResourceCRUDMutationOptions<KubeObjectData> {
  createCustomMessages?: (item: KubeObjectData) => CustomMessages;
  showMessages?: boolean;
  callbacks?: {
    onSuccess?: (data: UseResourceCRUDMutationReturnType<KubeObjectData, K8sOperation>) => void;
    onMutate?: (data: KubeObjectData) => void;
    onError?: (error: Error, data: KubeObjectData) => void;
  };
}

export interface MutationInput<KubeObjectData extends KubeObjectDraft> {
  resource: KubeObjectData;
  resourceConfig: K8sResourceConfig;
}

const getDefaultOptions = (variant: VariantType) =>
  ({
    autoHideDuration: 2000,
    anchorOrigin: {
      vertical: "bottom",
      horizontal: "left",
    },
    variant,
    content: (key: SnackbarKey, message: SnackbarMessage) => (
      <Snackbar snackbarKey={key} text={String(message)} variant={variant} />
    ),
  }) as const;

export const useResourceCRUDMutation = <KubeObjectData extends KubeObjectDraft, Operation extends K8sOperation>(
  mutationKey: string,
  operation: Operation,
  options?: UseResourceCRUDMutationOptions<KubeObjectData>
): UseMutationResult<
  UseResourceCRUDMutationReturnType<KubeObjectData, Operation>,
  Error,
  MutationInput<KubeObjectData>
> => {
  const showMessages = options?.showMessages ?? true;

  const {
    showBeforeRequestMessage,
    showRequestErrorMessage,
    showRequestSuccessMessage,
    showRequestErrorDetailedMessage,
  } = useRequestStatusMessages();

  const { namespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const mutationFn = async (input: MutationInput<KubeObjectData>) => {
    const { resource, resourceConfig } = input;
    const metadata = resource.metadata || {};
    const finalNamespace = metadata.namespace || namespace;

    switch (operation) {
      case k8sOperation.create:
        return await trpc.k8s.create.mutate({
          clusterName,
          resource,
          namespace: finalNamespace,
          resourceConfig,
        });

      case k8sOperation.patch:
        return await trpc.k8s.patch.mutate({
          clusterName,
          namespace: finalNamespace,
          name: resource.metadata.name,
          resource,
          resourceConfig,
        });

      case k8sOperation.delete:
        return await trpc.k8s.delete.mutate({
          clusterName,
          namespace: finalNamespace,
          name: resource.metadata.name,
          resourceConfig,
        });
    }
  };

  return useMutation({
    mutationKey: [mutationKey],
    mutationFn,
    onMutate: ({ resource }) => {
      if (!showMessages) return;

      const customMessage = options?.createCustomMessages?.(resource)?.onMutate;
      const defaultMsg = `${resource.kind} ${resource.metadata.name}`;

      const mergedOptions: OptionsObject = {
        ...getDefaultOptions("info"),
        ...(customMessage?.options || {}),
      };

      options?.callbacks?.onMutate?.(resource);

      showBeforeRequestMessage(operation, {
        entityName: defaultMsg,
        ...(customMessage && {
          customMessage: {
            message: customMessage.message || "",
            options: mergedOptions,
          },
        }),
      });
    },
    onSuccess: (_data, { resource }) => {
      if (!showMessages) return;

      const customMessage = options?.createCustomMessages?.(resource)?.onSuccess;
      const defaultMsg = `${resource.kind} ${resource.metadata.name}`;

      const mergedOptions: OptionsObject = {
        ...getDefaultOptions("success"),
        ...(customMessage?.options || {}),
      };

      options?.callbacks?.onSuccess?.(resource);

      showRequestSuccessMessage(operation, {
        entityName: defaultMsg,
        ...(customMessage && {
          customMessage: {
            message: customMessage.message || "",
            options: mergedOptions,
          },
        }),
      });
    },
    onError: (error, { resource }) => {
      if (!showMessages) return;

      const customMessage = options?.createCustomMessages?.(resource)?.onError;
      const defaultMsg = `${resource.kind} ${resource.metadata.name}`;

      const mergedOptions: OptionsObject = {
        ...getDefaultOptions("error"),
        ...(customMessage?.options || {}),
      };

      options?.callbacks?.onError?.(error, resource);

      showRequestErrorMessage(operation, {
        entityName: defaultMsg,
        ...(customMessage && {
          customMessage: {
            message: customMessage.message || "",
            options: mergedOptions,
          },
        }),
      });

      showRequestErrorDetailedMessage(error);
      console.error(error);
    },
  });
};
