import { ListItemAction } from "@/core/types/global";
import { krciCommonLabels, k8sOperation, K8sOperation, KubeObjectBase, ProtectedOperation } from "@my-project/shared";

type ProtectedState = Record<ProtectedOperation, { status: boolean; reason: string } | false>;

const getProtectedState = (protectedLabel: string): ProtectedState => {
  const actions = protectedLabel.split("-");

  return actions.reduce<ProtectedState>(
    (acc, cur) => {
      // Normalize RBAC verbs to K8s operations
      // K8s RBAC uses "update" verb, but our portal abstracts this as "patch" operation
      const normalizedAction = cur === "update" ? k8sOperation.patch : cur;

      switch (normalizedAction) {
        case k8sOperation.patch:
          acc.patch = {
            status: true,
            reason: "This resource is protected from updates.",
          };
          break;
        case k8sOperation.delete:
          acc.delete = {
            status: true,
            reason: "This resource is protected from deletion.",
          };
          break;
      }

      return acc;
    },
    {
      [k8sOperation.patch]: false,
      [k8sOperation.delete]: false,
    }
  );
};

/**
 * Check if a resource is protected from a specific operation based on its edit-protection label.
 * Use this to explicitly check protection status when needed.
 */
export function getResourceProtection(
  item: KubeObjectBase | undefined,
  actionType: K8sOperation
): { isProtected: boolean; reason: string } {
  const protectedLabel = item?.metadata?.labels?.[krciCommonLabels.editProtection];

  if (!protectedLabel) {
    return { isProtected: false, reason: "" };
  }

  const protectedState = getProtectedState(protectedLabel);
  const operationState = protectedState[actionType as ProtectedOperation];

  if (operationState) {
    return { isProtected: true, reason: operationState.reason };
  }

  return { isProtected: false, reason: "" };
}

interface PermissionCheck {
  allowed: boolean;
  reason: string;
}

/**
 * Combines resource protection status with permission check to create a unified disabled state.
 * Protection takes precedence over permission (if protected, use protection reason).
 */
export function getDisabledState(
  protection: { isProtected: boolean; reason: string },
  permission: PermissionCheck
): { status: boolean; reason: string } {
  const isDisabled = protection.isProtected || !permission.allowed;
  return {
    status: isDisabled,
    reason: protection.isProtected ? protection.reason : permission.reason,
  };
}

/**
 * Create a resource action for use in action menus.
 * The caller is responsible for determining the disabled state (including protection checks if needed).
 */
export const createResourceAction = <Item extends KubeObjectBase>({
  item,
  type,
  label,
  callback,
  disabled = {
    status: false,
    reason: "You cannot perform this action.",
  },
  isTextButton,
  Icon,
}: {
  item: Item;
  type: K8sOperation;
  label: string;
  callback?: (item: Item) => void;
  disabled?: { status: boolean; reason: string };
  Icon?: React.ReactNode;
  isTextButton?: boolean;
}): ListItemAction => {
  return {
    name: type,
    label,
    Icon,
    disabled: {
      status: disabled.status,
      reason: disabled.status ? disabled.reason : undefined,
    },
    action: (e) => {
      e.stopPropagation();
      if (callback) {
        callback(item);
      }
    },
    isTextButton,
  };
};
