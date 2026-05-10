import { Lock } from "lucide-react";
import { k8sSecretConfig } from "@my-project/shared";
import { secretColumns } from "./secrets.columns";
import { SecretOverviewTab } from "../../components/overrides/SecretOverviewTab";
import type { ResourceDescriptor } from "../types";

export const secretsDescriptor: ResourceDescriptor = {
  config: k8sSecretConfig,
  label: "Secrets",
  sidebarGroup: "Config",
  sidebarIcon: Lock,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: secretColumns,
  status: () => ({ phase: "Active", severity: "success" }),
  overviewTab: SecretOverviewTab,
};
