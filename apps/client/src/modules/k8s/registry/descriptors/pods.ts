import { Box } from "lucide-react";
import { k8sPodConfig } from "@my-project/shared";
import { PATH_K8S_PODS_FULL } from "../../constants/paths";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";
import type { ResourceDescriptor } from "../types";

export const podsDescriptor: ResourceDescriptor = {
  config: k8sPodConfig,
  label: "Pods",
  sidebarGroup: "Workloads",
  sidebarIcon: Box,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: (renderName) => [
    makeNameColumn(renderName),
    namespaceColumn,
    {
      id: "status",
      label: "Status",
      data: {
        render: ({ data }) => {
          const s = data as { status?: { phase?: string } };
          return s.status?.phase ?? "—";
        },
      },
      cell: { baseWidth: 10 },
    },
    ageColumn,
  ],
  listRoute: PATH_K8S_PODS_FULL,
};
