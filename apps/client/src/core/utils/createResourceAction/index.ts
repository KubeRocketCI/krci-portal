import { ListItemAction } from "@/core/types/global";
import { krciCommonLabels, k8sOperation, K8sOperation, KubeObjectBase, ProtectedOperation } from "@my-project/shared";

type ProtectedState = Record<ProtectedOperation, { status: boolean; reason: string } | false>;
type DisabledValue = { status: boolean; reason: string };

const getDisabledProtectedState = (protectedLabel: string): ProtectedState => {
  const actions = protectedLabel.split("-");

  return actions.reduce<ProtectedState>(
    (acc, cur) => {
      switch (cur) {
        case "update":
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

const getDisabledState = (item: KubeObjectBase, disabledDefaultValue: DisabledValue, actionType: K8sOperation) => {
  const isProtected = item?.metadata?.labels?.[krciCommonLabels.editProtection];

  if (!isProtected) {
    return {
      status: disabledDefaultValue.status,
      reason: disabledDefaultValue.status ? disabledDefaultValue.reason : undefined,
    };
  }

  const protectedDisabledState = getDisabledProtectedState(isProtected);

  return (protectedDisabledState[actionType as ProtectedOperation] || disabledDefaultValue) as DisabledValue;
};

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
  disabled?: DisabledValue;
  Icon?: React.ReactNode;
  isTextButton?: boolean;
}): ListItemAction => {
  return {
    name: type,
    label,
    Icon,
    disabled: getDisabledState(item, disabled, type),
    action: (e) => {
      e.stopPropagation();
      if (callback) {
        callback(item);
      }
    },
    isTextButton,
  };
};
