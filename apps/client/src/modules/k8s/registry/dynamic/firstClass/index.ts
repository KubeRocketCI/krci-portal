import type { ComponentType } from "react";
import type { KubeObjectBase } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import type { RenderName } from "../../descriptors/columnHelpers";
import {
  gatewayColumns,
  httpRouteColumns,
  securityPolicyColumns,
  backendTrafficPolicyColumns,
  clientTrafficPolicyColumns,
} from "./columns";
import { GatewayOverviewTab } from "@/modules/k8s/components/overrides/GatewayOverviewTab";
import { HTTPRouteOverviewTab } from "@/modules/k8s/components/overrides/HTTPRouteOverviewTab";
import { PolicyOverviewTab } from "@/modules/k8s/components/overrides/PolicyOverviewTab";

export interface FirstClassCROverride {
  columns: (renderName: RenderName) => TableColumn<KubeObjectBase>[];
  overviewTab?: ComponentType<{ item: KubeObjectBase }>;
}

const FIRST_CLASS_CR_OVERRIDES: Record<string, FirstClassCROverride> = {
  "gateway.networking.k8s.io/Gateway": { columns: gatewayColumns, overviewTab: GatewayOverviewTab },
  "gateway.networking.k8s.io/HTTPRoute": { columns: httpRouteColumns, overviewTab: HTTPRouteOverviewTab },
  "gateway.envoyproxy.io/SecurityPolicy": { columns: securityPolicyColumns, overviewTab: PolicyOverviewTab },
  "gateway.envoyproxy.io/BackendTrafficPolicy": {
    columns: backendTrafficPolicyColumns,
    overviewTab: PolicyOverviewTab,
  },
  "gateway.envoyproxy.io/ClientTrafficPolicy": { columns: clientTrafficPolicyColumns, overviewTab: PolicyOverviewTab },
};

export function getFirstClassCROverride(group: string, kind: string): FirstClassCROverride | undefined {
  return FIRST_CLASS_CR_OVERRIDES[`${group}/${kind}`];
}
