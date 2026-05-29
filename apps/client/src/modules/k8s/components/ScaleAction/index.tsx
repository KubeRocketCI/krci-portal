import { Maximize2 } from "lucide-react";
import type { KubeObjectBase } from "@my-project/shared";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useUpdatePermission } from "@/modules/k8s/hooks/useUpdatePermission";
import type { ScalableConfig } from "@/modules/k8s/hooks/useK8sScale";
import { ScaleDialog } from "./ScaleDialog";

interface Props {
  item: KubeObjectBase & {
    spec?: { replicas?: number };
    status?: { readyReplicas?: number; availableReplicas?: number };
  };
  config: ScalableConfig;
}

export function ScaleAction({ item, config }: Props) {
  const { allowed, reason } = useUpdatePermission(config);
  const openScale = useDialogOpener(ScaleDialog);

  return (
    <ButtonWithPermission
      allowed={allowed}
      reason={reason}
      ButtonProps={{ variant: "outline", size: "sm", onClick: () => openScale({ item, config }) }}
    >
      <Maximize2 size={14} className="mr-1.5" /> Scale
    </ButtonWithPermission>
  );
}
