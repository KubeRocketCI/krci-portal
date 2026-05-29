import { Undo2 } from "lucide-react";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useUpdatePermission } from "@/modules/k8s/hooks/useUpdatePermission";
import { useDeploymentRevisions } from "@/modules/k8s/hooks/useDeploymentRevisions";
import { RollbackDialog } from "./RollbackDialog";

interface Props {
  item: KubeObjectBase;
  config: K8sResourceConfig;
}

export function RollbackAction({ item, config }: Props) {
  const { allowed, reason } = useUpdatePermission(config);
  const openRollback = useDialogOpener(RollbackDialog);

  const namespace = item.metadata?.namespace ?? "";
  const name = item.metadata?.name ?? "";

  const revisions = useDeploymentRevisions({ namespace, name });
  const hasRevisions = (revisions.data?.length ?? 0) >= 2;
  const disabledReason = !hasRevisions ? "No previous revisions available" : reason;

  return (
    <ButtonWithPermission
      allowed={allowed && hasRevisions}
      reason={disabledReason}
      ButtonProps={{
        variant: "outline",
        size: "sm",
        onClick: () => openRollback({ namespace, name }),
        disabled: revisions.isLoading,
      }}
    >
      <Undo2 size={14} className="mr-1.5" /> Rollback
    </ButtonWithPermission>
  );
}
