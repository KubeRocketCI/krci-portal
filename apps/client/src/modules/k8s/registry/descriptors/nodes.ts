import { Server } from "lucide-react";
import { k8sNodeConfig } from "@my-project/shared";
import { PATH_K8S_NODES_FULL } from "../../constants/paths";
import { makeNameColumn, ageColumn } from "./columnHelpers";
import type { ResourceDescriptor } from "../types";

export const nodesDescriptor: ResourceDescriptor = {
  config: k8sNodeConfig,
  label: "Nodes",
  sidebarGroup: "Cluster",
  sidebarIcon: Server,
  detailVariant: "cluster",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: (renderName) => [
    makeNameColumn(renderName),
    {
      id: "status",
      label: "Status",
      data: {
        render: ({ data }) => {
          const s = data as { status?: { conditions?: Array<{ type: string; status: string }> } };
          const ready = s.status?.conditions?.find((c) => c.type === "Ready");
          return ready?.status === "True" ? "Ready" : "NotReady";
        },
      },
      cell: { baseWidth: 10 },
    },
    ageColumn,
  ],
  listRoute: PATH_K8S_NODES_FULL,
};
