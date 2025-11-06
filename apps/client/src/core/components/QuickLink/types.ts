import { RouteParams } from "@/core/router/types";
import type { ButtonProps } from "@/core/components/ui/button";
import { QuickLink } from "@my-project/shared";
import React from "react";

export interface QuickLinkExternalLinkProps {
  externalLink?: string;
  Icon?: React.ReactElement;
  iconBase64?: string;
  name?: {
    label?: string;
    value?: string;
  };
  enabledText?: string;
  configurationRoute?: RouteParams;
  quickLink?: QuickLink;
  isTextButton?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}
