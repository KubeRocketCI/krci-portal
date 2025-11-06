import type { ButtonProps } from "@/core/components/ui/button";

export interface ResourceIconLinkProps {
  tooltipTitle: string | React.ReactElement;
  name?: string;
  Icon?: React.ReactElement;
  iconBase64?: string;
  link?: string;
  disabled?: boolean;
  withoutDisabledStyle?: boolean;
  isTextButton?: boolean;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}
