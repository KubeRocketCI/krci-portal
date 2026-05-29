import { RotateCcw } from "lucide-react";
import type { KubeObjectBase } from "@my-project/shared";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useUpdatePermission } from "@/modules/k8s/hooks/useUpdatePermission";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ConfirmDialog } from "@/core/components/Confirm";
import { useK8sRestart, type RestartableConfig } from "@/modules/k8s/hooks/useK8sRestart";

interface Props {
  item: KubeObjectBase;
  config: RestartableConfig;
}

export function RestartAction({ item, config }: Props) {
  const { allowed, reason } = useUpdatePermission(config);
  const restart = useK8sRestart(config);
  const openConfirm = useDialogOpener(ConfirmDialog);

  const namespace = item.metadata?.namespace ?? "";
  const name = item.metadata?.name ?? "";

  const handleClick = () => {
    openConfirm({
      text: `Restart ${config.kind} ${name} rollout? This will trigger a rolling update of all pods.`,
      actionCallback: async () => {
        restart.mutate({ namespace, name });
      },
    });
  };

  return (
    <ButtonWithPermission
      allowed={allowed}
      reason={reason}
      ButtonProps={{ variant: "outline", size: "sm", onClick: handleClick }}
    >
      <RotateCcw size={14} className="mr-1.5" /> Restart
    </ButtonWithPermission>
  );
}
