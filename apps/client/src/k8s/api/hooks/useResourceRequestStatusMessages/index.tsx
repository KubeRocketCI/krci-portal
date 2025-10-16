import { showToast, ToastOptions, ToastVariant } from "@/core/components/Snackbar";
import { k8sOperation, K8sOperation } from "@my-project/shared";

interface Options {
  entityName?: string;
  customMessage?: {
    message: string;
    options?: ToastOptions;
  };
}

const getDefaultDuration = (variant: ToastVariant): number => {
  switch (variant) {
    case "info":
      return 2000;
    case "success":
      return 5000;
    case "error":
      return 5000;
    case "warning":
      return 5000;
    default:
      return 5000;
  }
};

export const useRequestStatusMessages = () => {
  const showBeforeRequestMessage = (operation: K8sOperation, { entityName, customMessage }: Options) => {
    const beforeRequestMessage: string = (() => {
      switch (operation) {
        case k8sOperation.create:
          return `Applying ${entityName || "resource"}`;
        case k8sOperation.patch:
          return `Patching ${entityName || "resource"}`;
        case k8sOperation.delete:
          return `Deleting ${entityName || "resource"}`;
        default:
          return `Processing ${entityName || "resource"}`;
      }
    })();

    const variant: ToastVariant = "info";
    const defaultDuration = getDefaultDuration(variant);

    if (customMessage) {
      const { message, options = {} } = customMessage;
      showToast(message, variant, { duration: defaultDuration, ...options });
    } else {
      showToast(beforeRequestMessage, variant, { duration: defaultDuration });
    }
  };

  const showRequestSuccessMessage = (operation: K8sOperation, { entityName, customMessage }: Options) => {
    const requestSuccessMessage: string = (() => {
      switch (operation) {
        case k8sOperation.create:
          return `${entityName || "Resource"} has been successfully applied`;
        case k8sOperation.patch:
          return `${entityName || "Resource"} has been successfully patched`;
        case k8sOperation.delete:
          return `${entityName || "Resource"} has been successfully deleted`;
        default:
          return `${entityName || "Resource"} operation completed successfully`;
      }
    })();

    const variant: ToastVariant = "success";
    const defaultDuration = getDefaultDuration(variant);

    if (customMessage) {
      const { message, options = {} } = customMessage;
      showToast(message, variant, { duration: defaultDuration, ...options });
    } else {
      showToast(requestSuccessMessage, variant, { duration: defaultDuration });
    }
  };

  const showRequestErrorMessage = (operation: K8sOperation, { entityName, customMessage }: Options) => {
    const requestErrorMessage: string = (() => {
      switch (operation) {
        case k8sOperation.create:
          return `Failed to apply ${entityName || "resource"}`;
        case k8sOperation.patch:
          return `Failed to patch ${entityName || "resource"}`;
        case k8sOperation.delete:
          return `Failed to delete ${entityName || "resource"}`;
        default:
          return `Operation failed for ${entityName || "resource"}`;
      }
    })();

    const variant: ToastVariant = "error";
    const defaultDuration = getDefaultDuration(variant);

    if (customMessage) {
      const { message, options = {} } = customMessage;
      showToast(message, variant, { duration: defaultDuration, ...options });
    } else {
      showToast(requestErrorMessage, variant, { duration: defaultDuration });
    }
  };

  const showRequestErrorDetailedMessage = (error: unknown) => {
    showToast(error?.toString() || "An error occurred", "error", { duration: 5000 });
  };

  return {
    showBeforeRequestMessage,
    showRequestSuccessMessage,
    showRequestErrorMessage,
    showRequestErrorDetailedMessage,
  };
};
