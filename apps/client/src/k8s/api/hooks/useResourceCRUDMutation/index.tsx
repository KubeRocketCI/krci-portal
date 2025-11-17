import { useTRPCClient } from "@/core/providers/trpc";
import { showToast, ToastOptions } from "@/core/components/Snackbar";
import { useClusterStore } from "@/k8s/store";
import { K8sOperation, k8sOperation, K8sResourceConfig, KubeObjectDraft } from "@my-project/shared";
import { useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

type UseResourceCRUDMutationReturnType<
  KubeObjectData,
  Operation extends K8sOperation,
> = Operation extends typeof k8sOperation.delete ? void : KubeObjectData;

interface Message {
  message: string;
  options?: ToastOptions;
}

type CustomMessages = {
  loading?: Message;
  error?: Message;
  success?: Message;
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

export const useResourceCRUDMutation = <KubeObjectData extends KubeObjectDraft, Operation extends K8sOperation>(
  mutationKey: string,
  operation: Operation,
  options?: UseResourceCRUDMutationOptions<KubeObjectData>
) => {
  const trpc = useTRPCClient();
  const showMessages = options?.showMessages ?? true;

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
    mutationFn: async (input: MutationInput<KubeObjectData>) => {
      const { resource } = input;

      if (!showMessages) {
        return mutationFn(input);
      }

      const customMessages = options?.createCustomMessages?.(resource);
      const defaultMsg = `${resource.kind} ${resource.metadata.name}`;

      // Get messages for toast.promise
      const loadingMessage: string = (() => {
        if (customMessages?.loading) return customMessages.loading.message;
        switch (operation) {
          case k8sOperation.create:
            return `Applying ${defaultMsg}`;
          case k8sOperation.patch:
            return `Patching ${defaultMsg}`;
          case k8sOperation.delete:
            return `Deleting ${defaultMsg}`;
          default:
            return `Processing ${defaultMsg}`;
        }
      })();

      const successMessage: string = (() => {
        if (customMessages?.success) return customMessages.success.message;
        switch (operation) {
          case k8sOperation.create:
            return `${defaultMsg} has been successfully applied`;
          case k8sOperation.patch:
            return `${defaultMsg} has been successfully patched`;
          case k8sOperation.delete:
            return `${defaultMsg} has been successfully deleted`;
          default:
            return `${defaultMsg} operation completed successfully`;
        }
      })();

      const errorMessage: string = (() => {
        if (customMessages?.error) return customMessages.error.message;
        switch (operation) {
          case k8sOperation.create:
            return `Failed to apply ${defaultMsg}`;
          case k8sOperation.patch:
            return `Failed to patch ${defaultMsg}`;
          case k8sOperation.delete:
            return `Failed to delete ${defaultMsg}`;
          default:
            return `Operation failed for ${defaultMsg}`;
        }
      })();

      // Manual promise handling with custom toasts for full control
      const promise = mutationFn(input);

      // Show loading toast
      const loadingToastId = showToast(loadingMessage, "loading");

      promise
        .then(() => {
          // Update to success toast with optional link
          showToast(successMessage, "success", {
            id: loadingToastId,
            duration: customMessages?.success?.options?.duration || 5000,
            route: customMessages?.success?.options?.route,
            externalLink: customMessages?.success?.options?.externalLink,
          });
        })
        .catch((err) => {
          // Extract error message for description
          const errorDescription = err?.message || String(err);

          // Update to error toast with description
          showToast(errorMessage, "error", {
            id: loadingToastId,
            duration: 10000, // Longer duration for errors with details
            description: errorDescription,
          });
          console.error(err);
        });

      return promise;
    },
    onMutate: ({ resource }) => {
      options?.callbacks?.onMutate?.(resource);
    },
    onSuccess: (_data, { resource }) => {
      options?.callbacks?.onSuccess?.(resource);
    },
    onError: (error, { resource }) => {
      options?.callbacks?.onError?.(error, resource);
    },
  });
};
