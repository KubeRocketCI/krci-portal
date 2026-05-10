import { HardDrive } from "lucide-react";
import { k8sPersistentVolumeConfig } from "@my-project/shared";
import { persistentVolumeColumns } from "./persistent-volumes.columns";
import type { ResourceDescriptor } from "../types";

export const persistentVolumesDescriptor: ResourceDescriptor = {
  config: k8sPersistentVolumeConfig,
  label: "PersistentVolumes",
  sidebarGroup: "Storage",
  sidebarIcon: HardDrive,
  detailVariant: "cluster",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: persistentVolumeColumns,
  status: (item) => {
    const phase = (item as { status?: { phase?: string } }).status?.phase ?? "";
    if (phase === "Bound") return { phase: "Bound", severity: "success" };
    if (phase === "Available") return { phase: "Available", severity: "success" };
    if (phase === "Released") return { phase: "Released", severity: "warning" };
    if (phase === "Failed") return { phase: "Failed", severity: "error" };
    return { phase: phase || "Unknown", severity: "neutral" };
  },
};
