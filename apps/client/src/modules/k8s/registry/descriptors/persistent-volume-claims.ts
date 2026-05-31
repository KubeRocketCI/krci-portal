import { Database } from "lucide-react";
import { k8sPersistentVolumeClaimConfig } from "@my-project/shared";
import { persistentVolumeClaimColumns } from "./persistent-volume-claims.columns";
import { PVCOverviewTab } from "../../components/overrides/PVCOverviewTab";
import type { ResourceDescriptor } from "../types";

export const persistentVolumeClaimsDescriptor: ResourceDescriptor = {
  config: k8sPersistentVolumeClaimConfig,
  label: "PersistentVolumeClaims",
  sidebarGroup: "Storage",
  sidebarIcon: Database,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: persistentVolumeClaimColumns,
  status: (item) => {
    const phase = (item as { status?: { phase?: string } }).status?.phase ?? "";
    if (phase === "Bound") return { phase: "Bound", severity: "success" };
    if (phase === "Pending") return { phase: "Pending", severity: "warning" };
    return { phase: phase || "Unknown", severity: "neutral" };
  },
  overviewTab: PVCOverviewTab,
};
