import { ValueOf } from "@/core/types/global";
import { QuickLink, systemQuickLink } from "@my-project/shared";

type AllowedType = ValueOf<typeof systemQuickLink> & string;

export const isSystemQuickLink = (component: QuickLink) => {
  if (!component) {
    return false;
  }

  const allowedTypes: Array<AllowedType> = Object.values(systemQuickLink);
  return allowedTypes.includes(component.metadata.name as AllowedType);
};
