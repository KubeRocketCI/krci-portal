import { Snackbar } from "@/core/components/Snackbar";
import { k8sOperation, K8sOperation } from "@my-project/shared";
import { OptionsObject, SnackbarKey, SnackbarMessage, useSnackbar, VariantType } from "notistack";

interface Options {
  entityName?: string;
  customMessage?: {
    message: string;
    options?: OptionsObject;
  };
}

const getDefaultOptions = (variant: VariantType, autoHideDuration: number = 5000) => {
  return {
    autoHideDuration,
    anchorOrigin: {
      vertical: "bottom",
      horizontal: "left",
    },
    variant,
    content: (key: SnackbarKey, message: SnackbarMessage) => (
      <Snackbar snackbarKey={key} text={String(message)} variant={variant} />
    ),
  } as const;
};

export const useRequestStatusMessages = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showBeforeRequestMessage = (operation: K8sOperation, { entityName, customMessage }: Options) => {
    const beforeRequestMessage = (() => {
      switch (operation) {
        case k8sOperation.create:
          return `Applying ${entityName}`;
        case k8sOperation.patch:
          return `Patching ${entityName}`;
        case k8sOperation.delete:
          return `Deleting ${entityName}`;
      }
    })();

    const defaultOptions = getDefaultOptions("info", 2000);

    if (customMessage) {
      const { message, options = {} } = customMessage;
      const mergedOptions = {
        ...defaultOptions,
        ...options,
      };
      enqueueSnackbar(message, mergedOptions);
    } else {
      enqueueSnackbar(beforeRequestMessage, defaultOptions);
    }
  };

  const showRequestSuccessMessage = (operation: K8sOperation, { entityName, customMessage }: Options) => {
    const requestSuccessMessage = (() => {
      switch (operation) {
        case k8sOperation.create:
          return `${entityName} has been successfully applied`;
        case k8sOperation.patch:
          return `${entityName} has been successfully patched`;
        case k8sOperation.delete:
          return `${entityName} has been successfully deleted`;
      }
    })();

    const defaultOptions = getDefaultOptions("success");

    if (customMessage) {
      const { message, options = {} } = customMessage;
      const mergedOptions = {
        ...defaultOptions,
        ...options,
      };

      enqueueSnackbar(message, mergedOptions);
    } else {
      enqueueSnackbar(requestSuccessMessage, defaultOptions);
    }
  };

  const showRequestErrorMessage = (operation: K8sOperation, { entityName, customMessage }: Options) => {
    const requestErrorMessage = (() => {
      switch (operation) {
        case k8sOperation.create:
          return `Failed to apply ${entityName}`;
        case k8sOperation.patch:
          return `Failed to patch ${entityName}`;
        case k8sOperation.delete:
          return `Failed to delete ${entityName}`;
      }
    })();

    const defaultOptions = getDefaultOptions("error");

    if (customMessage) {
      const { message, options = {} } = customMessage;
      const mergedOptions = {
        ...defaultOptions,
        ...options,
      };
      enqueueSnackbar(message, mergedOptions);
    } else {
      enqueueSnackbar(requestErrorMessage, defaultOptions);
    }
  };

  const showRequestErrorDetailedMessage = (error: unknown) => {
    enqueueSnackbar(error?.toString(), {
      autoHideDuration: 5000,
      anchorOrigin: {
        vertical: "bottom",
        horizontal: "left",
      },
      content: (key, message) => <Snackbar snackbarKey={key} text={String(message)} variant="error" />,
    });
  };

  return {
    showBeforeRequestMessage,
    showRequestSuccessMessage,
    showRequestErrorMessage,
    showRequestErrorDetailedMessage,
  };
};
