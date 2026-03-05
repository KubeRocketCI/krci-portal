import type { ButtonProps } from "@/core/components/ui/button";

export interface ResourceIconLinkProps {
  tooltip: string | React.ReactElement;
  name?: string;
  icon?: React.ReactElement | string;
  href?: string;
  disabled?: boolean;
  display?: "icon" | "text";
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}
