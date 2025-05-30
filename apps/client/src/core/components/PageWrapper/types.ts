import { RouteParams } from "@/core/router/types";
import { ContainerTypeMap } from "@mui/material/Container/Container";
import React from "react";

export interface Breadcrumb {
  label: string | React.ReactElement;
  route?: RouteParams;
}

export interface PageWrapperProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  headerSlot?: React.ReactElement | undefined;
  breadcrumbsExtraContent?: React.ReactElement;
  containerMaxWidth?: ContainerTypeMap["props"]["maxWidth"];
}
