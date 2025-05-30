import { DialogProps } from "@/core/providers/Dialog/types";
import { RouterPaths } from "@/core/router/types";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { OptionsObject } from "notistack";
import React from "react";

interface Message {
  message: string;
  options?: OptionsObject;
}

type CustomMessages = {
  onMutate?: Message;
  onError?: Message;
  onSuccess?: Message;
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
  backRoute?: RouterPaths;
  createCustomMessages?: (item: KubeObjectBase) => CustomMessages;
}>;
