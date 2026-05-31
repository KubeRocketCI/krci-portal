import { FileType } from "lucide-react";
import { k8sStorageClassConfig } from "@my-project/shared";
import { storageClassColumns } from "./storage-classes.columns";
import { StorageClassOverviewTab } from "../../components/overrides/StorageClassOverviewTab";
import type { ResourceDescriptor } from "../types";

export const storageClassesDescriptor: ResourceDescriptor = {
  config: k8sStorageClassConfig,
  label: "StorageClasses",
  sidebarGroup: "Storage",
  sidebarIcon: FileType,
  detailVariant: "cluster",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: storageClassColumns,
  status: () => ({ phase: "Active", severity: "success" }),
  overviewTab: StorageClassOverviewTab,
};
