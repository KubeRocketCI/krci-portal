import { router } from "@/core/router";
import { ContainerTypeMap } from "@mui/material/Container/Container";
import { LinkProps } from "@tanstack/react-router";
import React from "react";

export interface Breadcrumb {
  label: string | React.ReactElement;
  url?: LinkProps<typeof router.routesById>;
}

export interface PageWrapperProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  headerSlot?: React.ReactElement | undefined;
  breadcrumbsExtraContent?: React.ReactElement;
  containerMaxWidth?: ContainerTypeMap["props"]["maxWidth"];
}
