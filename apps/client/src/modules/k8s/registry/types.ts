import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import type { BadgeProps } from "@/core/components/ui/badge";
import type { RenderName } from "./descriptors/columnHelpers";

export type SidebarGroup = "Workloads" | "Network" | "Storage" | "Config" | "Security" | "Cluster" | "CustomResources";
export type DetailVariant = "namespaced" | "cluster";

export interface ResourceStatus {
  phase: string;
  severity: NonNullable<BadgeProps["variant"]>;
}

export interface ResourceDescriptor {
  config: K8sResourceConfig;
  label: string;
  columns: (renderName: RenderName) => TableColumn<KubeObjectBase>[];
  defaultSort?: { sortBy: string; order: "asc" | "desc" };
  sidebarGroup: SidebarGroup;
  sidebarIcon?: LucideIcon;
  detailVariant: DetailVariant;
  /**
   * When true, the name column links to the generic CR detail routes
   * (PATH_K8S_CR_DETAIL_{CLUSTER,NS}_FULL) using group/version/pluralName
   * instead of the built-in resource kind routes.
   * Must be set together with non-empty config.group, config.version, and config.pluralName.
   */
  customResource?: boolean;
  status?: (item: KubeObjectBase) => ResourceStatus;
  overviewTab?: ComponentType<{ item: KubeObjectBase }>;
  sidebarHidden?: true;
  /** Overrides the default generic list route link in the sidebar. Full path with $clusterName param. */
  listRoute?: string;
  /** Per-kind header actions rendered to the right of Delete in K8sDetailPage. */
  actionsSlot?: ComponentType<{ item: KubeObjectBase }>;
}

export type ResourceRegistry = Record<string, ResourceDescriptor>;
