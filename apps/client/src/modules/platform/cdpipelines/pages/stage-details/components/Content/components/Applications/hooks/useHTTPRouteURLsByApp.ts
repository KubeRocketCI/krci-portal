import React from "react";
import { inClusterName } from "@my-project/shared";
import { useStageWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { useGatewayWatchList } from "@/k8s/api/groups/GatewayAPI/Gateway";
import { useHTTPRouteWatchList } from "@/k8s/api/groups/GatewayAPI/HTTPRoute";
import { buildNetworkingData } from "../../Networking/live/buildNetworkingData";
import { deriveHTTPRouteURLs } from "../../Networking/utils";
import type { ExposureURL } from "../components/columns/Ingress";

/**
 * Feature 1 — live HTTPRoute exposure URLs per Application.
 *
 * Watches Gateway + HTTPRoute in the stage namespace, derives each route's
 * external URL(s) (scheme from the listener, host from the route hostnames,
 * path from the first rule match), and attributes them to an app by the
 * route's backendRef Service name (which matches the KRCI codebase/app name).
 *
 * Returns Map<appName, ExposureURL[]> for the Applications-table "URLs" column
 * to merge with Argo CD's Ingress-derived `status.summary.externalURLs`.
 */
export function useHTTPRouteURLsByApp(): Map<string, ExposureURL[]> {
  const stageWatch = useStageWatch();
  const stage = stageWatch.query.data;
  const namespace = stage?.spec.namespace;

  // The portal cannot watch a remote cluster's Gateway API resources, so for
  // remote-cluster stages we skip these watches entirely. The Applications
  // table then shows only Argo CD's Ingress-derived externalURLs.
  const isRemoteCluster = stage !== undefined && stage.spec.clusterName !== inClusterName;

  const gatewayWatch = useGatewayWatchList({ namespace, queryOptions: { enabled: !!namespace && !isRemoteCluster } });
  const httpRouteWatch = useHTTPRouteWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  return React.useMemo(() => {
    const byApp = new Map<string, ExposureURL[]>();
    const gateways = gatewayWatch.data?.array ?? [];
    const httpRoutes = httpRouteWatch.data?.array ?? [];
    if (!namespace || isRemoteCluster || (gateways.length === 0 && httpRoutes.length === 0)) return byApp;

    const data = buildNetworkingData({ gateways, httpRoutes });

    for (const route of data.httpRoutes) {
      const urls: ExposureURL[] = deriveHTTPRouteURLs(route, data.gateways).map((u) => ({
        url: u.url,
        kind: "HTTPRoute",
        healthy: u.healthy,
      }));
      if (urls.length === 0) continue;

      const backendNames = new Set(route.rules.map((r) => r.backendName).filter(Boolean));
      for (const name of backendNames) {
        const list = byApp.get(name) ?? [];
        for (const u of urls) if (!list.some((x) => x.url === u.url)) list.push(u);
        byApp.set(name, list);
      }
    }

    return byApp;
  }, [namespace, isRemoteCluster, gatewayWatch.data, httpRouteWatch.data]);
}
