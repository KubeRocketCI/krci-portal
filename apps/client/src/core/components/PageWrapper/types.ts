import { RouteParams } from "@/core/router/types";
import React from "react";

export interface Breadcrumb {
  label: string | React.ReactElement;
  route?: RouteParams;
}

export type ContainerMaxWidth = "xs" | "sm" | "md" | "lg" | "xl" | false;

export interface PageWrapperProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  headerSlot?: React.ReactElement | undefined;
  breadcrumbsExtraContent?: React.ReactElement;
  containerMaxWidth?: ContainerMaxWidth;
}
