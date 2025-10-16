import { ToastOptions } from "@/core/components/Snackbar";
import { DialogProps } from "@/core/providers/Dialog/types";
import { RouteParams } from "@/core/router/types";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import React from "react";

interface Message {
  message: string;
  options?: ToastOptions;
}

type CustomMessages = {
  loading?: Message;
  error?: Message;
  success?: Message;
};

export type DeleteKubeObjectDialogProps = DialogProps<{
  description: string;
  objectName: string | undefined;
  resourceConfig: K8sResourceConfig;
  resource: KubeObjectBase;
  onBeforeSubmit?(
    setErrorTemplate: React.Dispatch<React.SetStateAction<React.ReactNode>>,
    setLoadingActive: React.Dispatch<React.SetStateAction<boolean>>
  ): Promise<void>;
  backRoute?: RouteParams;
  createCustomMessages?: (item: KubeObjectBase) => CustomMessages;
}>;
