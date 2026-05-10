import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import type { BadgeProps } from "@/core/components/ui/badge";
import type { RenderName } from "./descriptors/columnHelpers";

export type SidebarGroup = "Workloads" | "Network" | "Storage" | "Config" | "Security" | "Cluster";
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
  status?: (item: KubeObjectBase) => ResourceStatus;
  overviewTab?: ComponentType<{ item: KubeObjectBase }>;
  template?: (namespace: string) => string;
  sidebarHidden?: true;
  /** Overrides the default generic list route link in the sidebar. Full path with $clusterName param. */
  listRoute?: string;
}

export type ResourceRegistry = Record<string, ResourceDescriptor>;
