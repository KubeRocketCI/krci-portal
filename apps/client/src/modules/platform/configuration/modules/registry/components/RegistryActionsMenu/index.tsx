import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import type { ConfigMap, Secret } from "@my-project/shared";
import { k8sOperation } from "@my-project/shared";
import { Settings, Trash } from "lucide-react";
import React from "react";

interface RegistryActionsMenuProps {
  EDPConfigMap: ConfigMap;
  pushAccountSecret: Secret | undefined;
  pullAccountSecret: Secret | undefined;
  onEdit: () => void;
  onReset: () => void;
}

export const RegistryActionsMenu = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  onEdit,
  onReset,
}: RegistryActionsMenuProps) => {
  const secretPermissions = useSecretPermissions();

  const someOfTheSecretsHasExternalOwner =
    !!pushAccountSecret?.metadata?.ownerReferences || !!pullAccountSecret?.metadata?.ownerReferences;

  const canReset = !someOfTheSecretsHasExternalOwner && secretPermissions.data.delete.allowed;

  const actions = React.useMemo(() => {
    if (!EDPConfigMap) {
      return [];
    }

    return [
      {
        name: k8sOperation.update,
        label: "Edit",
        Icon: <Settings size={16} />,
        disabled: {
          status: false,
          reason: undefined,
        },
        action: (e: React.SyntheticEvent) => {
          e.stopPropagation();
          onEdit();
        },
      },
      {
        name: k8sOperation.delete,
        label: "Reset",
        Icon: <Trash size={16} />,
        disabled: {
          status: !canReset,
          reason: canReset
            ? undefined
            : someOfTheSecretsHasExternalOwner
              ? "Cannot reset: secrets have external owners"
              : secretPermissions.data.delete.reason,
        },
        action: (e: React.SyntheticEvent) => {
          e.stopPropagation();
          onReset();
        },
      },
    ];
  }, [EDPConfigMap, canReset, someOfTheSecretsHasExternalOwner, secretPermissions.data.delete.reason, onEdit, onReset]);

  return <ActionsMenuList actions={actions} />;
};
