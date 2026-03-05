import type React from "react";
import type { ButtonProps } from "@/core/components/ui/button";

export interface QuickLinkProps {
  name: string;
  href?: string;
  tooltip?: string;
  icon?: React.ReactElement | string;
  setupAction?: React.ReactNode;
  display?: "icon" | "text";
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}
