import type { KubeObjectBase } from "@my-project/shared";
import type { DialogProps } from "@/core/providers/Dialog/types";
import type { ScalableConfig } from "@/modules/k8s/hooks/useK8sScale";

export type ScaleDialogProps = DialogProps<{
  item: KubeObjectBase & {
    spec?: { replicas?: number };
    status?: { readyReplicas?: number; availableReplicas?: number };
  };
  config: ScalableConfig;
}>;
