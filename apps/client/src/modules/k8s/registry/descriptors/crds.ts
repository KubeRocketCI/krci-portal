import { Puzzle } from "lucide-react";
import { k8sCustomResourceDefinitionConfig, type CRDObject } from "@my-project/shared";
import { PATH_K8S_CRDS_FULL } from "../../constants/paths";
import { crdsMvpColumns } from "./crds.columns";
import type { ResourceDescriptor } from "../types";

export const crdsDescriptor: ResourceDescriptor = {
  config: k8sCustomResourceDefinitionConfig,
  label: "CRDs",
  sidebarGroup: "CustomResources",
  // The "Custom Resources" group itself navigates to the CRDs list (see nav.ts),
  // so the standalone "CRDs" leaf would just duplicate the parent header.
  sidebarHidden: true,
  sidebarIcon: Puzzle,
  detailVariant: "cluster",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: crdsMvpColumns,
  status: (item) => {
    const conditions = (item as CRDObject).status?.conditions ?? [];
    const established = conditions.find((c) => c.type === "Established");
    const namesAccepted = conditions.find((c) => c.type === "NamesAccepted");
    // NamesAccepted=False blocks the CRD even if Established is True — surface it as destructive.
    if (namesAccepted?.status === "False") return { phase: "NamesConflict", severity: "destructive" };
    if (established?.status === "True") return { phase: "Established", severity: "success" };
    if (established?.status === "False") return { phase: "NotEstablished", severity: "destructive" };
    return { phase: "Unknown", severity: "secondary" };
  },
  listRoute: PATH_K8S_CRDS_FULL,
};
