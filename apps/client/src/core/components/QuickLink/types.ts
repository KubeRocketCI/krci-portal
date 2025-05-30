import { router } from "@/core/router";
import { ButtonProps } from "@mui/material";
import { QuickLink } from "@my-project/shared";
import { LinkProps } from "@tanstack/react-router";
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
  configurationLink?: LinkProps<typeof router.routesById>;
  quickLink?: QuickLink;
  isTextButton?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}
