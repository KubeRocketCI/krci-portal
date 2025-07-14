import { RouteParams } from "@/core/router/types";

type EmptyListActionProps =
  | {
      handleClick: () => void;
      route?: never;
    }
  | {
      handleClick?: never;
      route: RouteParams;
    }
  | {
      handleClick?: never;
      route?: never;
    };

export type EmptyListProps = EmptyListActionProps & {
  missingItemName?: string;
  customText?: string;
  description?: string;
  linkText?: string;
  beforeLinkText?: string;
  isSearch?: boolean;
  icon?: React.ReactNode;
  iconSize?: number;
};
