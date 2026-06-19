import React from "react";
import { inClusterName } from "@my-project/shared";
import { useStageWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { useGatewayWatchList } from "@/k8s/api/groups/GatewayAPI/Gateway";
import { useHTTPRouteWatchList } from "@/k8s/api/groups/GatewayAPI/HTTPRoute";
import { useServiceWatchList } from "@/k8s/api/groups/Core/Service/hooks";
import { usePodWatchList } from "@/k8s/api/groups/Core/Pod/hooks";
import { useIngressWatchList } from "@/k8s/api/groups/Networking/Ingress/hooks";
import {
  useSecurityPolicyWatchList,
  useBackendTrafficPolicyWatchList,
  useClientTrafficPolicyWatchList,
} from "@/k8s/api/groups/EnvoyGateway";
import { Skeleton } from "@/core/components/ui/skeleton";
import { RemoteClusterNotice } from "../../Monitoring/components/RemoteClusterNotice";
import { Networking } from "../index";
import { buildNetworkingData } from "./buildNetworkingData";
import { useExposureMetrics } from "./useExposureMetrics";

/**
 * Live container for the Networking tab.
 *
 * Wires Gateway + HTTPRoute watch-list hooks (primary — errors from these drive
 * crd-absent / rbac-denied state) plus Service, Pod, Ingress, SecurityPolicy,
 * BackendTrafficPolicy, ClientTrafficPolicy, and Envoy data-plane Services
 * (all optional — errors are silently treated as empty arrays).
 *
 * For remote-cluster stages every watch is disabled and the tab short-circuits
 * to a RemoteClusterNotice, mirroring the Monitoring tab — the portal cannot
 * reach a remote cluster's Gateway API resources or its Prometheus metrics.
 */
export function NetworkingLive() {
  const params = routeStageDetails.useParams();
  const stageWatch = useStageWatch();
  const stage = stageWatch.query.data;
  const namespace = stage?.spec.namespace;

  const isRemoteCluster = stage !== undefined && stage.spec.clusterName !== inClusterName;

  const exposureMetrics = useExposureMetrics({
    clusterName: params.clusterName,
    namespace: namespace ?? "",
    enabled: !!namespace && !isRemoteCluster,
  });

  const gatewayWatch = useGatewayWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  const httpRouteWatch = useHTTPRouteWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  // Secondary watches: errors are silently treated as empty arrays, never blank the tab.
  const serviceWatch = useServiceWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  const podWatch = usePodWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  const ingressWatch = useIngressWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  const securityPolicyWatch = useSecurityPolicyWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  const backendTrafficPolicyWatch = useBackendTrafficPolicyWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  const clientTrafficPolicyWatch = useClientTrafficPolicyWatchList({
    namespace,
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  // Envoy data-plane Services live in a fixed namespace regardless of stage.
  const envoyServiceWatch = useServiceWatchList({
    namespace: "envoy-gateway-system",
    queryOptions: { enabled: !!namespace && !isRemoteCluster },
  });

  // ── Happy-path data (memoized before any early returns to satisfy Rules of Hooks) ──
  // The watch hooks always expose .data.array (empty when loading/error), so this
  // is safe to call unconditionally. The memo only re-evaluates when the underlying
  // arrays change — NOT on every 15 s metric heartbeat.
  const data = React.useMemo(
    () =>
      buildNetworkingData({
        gateways: gatewayWatch.data.array,
        httpRoutes: httpRouteWatch.data.array,
        services: serviceWatch.data.array,
        pods: podWatch.data.array,
        ingresses: ingressWatch.data.array,
        policies: {
          securityPolicies: securityPolicyWatch.data.array,
          backendTrafficPolicies: backendTrafficPolicyWatch.data.array,
          clientTrafficPolicies: clientTrafficPolicyWatch.data.array,
        },
        envoyServices: envoyServiceWatch.data.array,
      }),
    [
      gatewayWatch.data.array,
      httpRouteWatch.data.array,
      serviceWatch.data.array,
      podWatch.data.array,
      ingressWatch.data.array,
      securityPolicyWatch.data.array,
      backendTrafficPolicyWatch.data.array,
      clientTrafficPolicyWatch.data.array,
      envoyServiceWatch.data.array,
    ]
  );

  // The exposure topology relies on in-cluster Gateway API / Envoy resources and
  // Prometheus metrics, neither of which the portal can reach for a remote cluster.
  // Mirror the Monitoring tab: render a notice instead of an empty/misleading topology.
  // All watches above are gated on `!isRemoteCluster`, so nothing is fetched against the remote.
  if (isRemoteCluster) {
    return (
      <RemoteClusterNotice description="We're working on making this work for remote clusters. For now, the networking topology and exposure metrics are available only for stages running in the local cluster." />
    );
  }

  // Only gateway + httproute errors drive the tab-level error states.
  // 404 → CRD absent; 403 → RBAC denied.
  const gatewayHttpStatus = gatewayWatch.query.error?.data?.httpStatus;
  const httpRouteHttpStatus = httpRouteWatch.query.error?.data?.httpStatus;

  // When Gateway API is unavailable, Gateway/HTTPRoute (and their policies) can't
  // be shown, but Ingresses are watched independently (networking.k8s.io) and are
  // surfaced as the crd-absent banner promises.
  const ingressOnlyData = { ...data, gateways: [], httpRoutes: [], policies: [] };

  if (gatewayHttpStatus === 404 || httpRouteHttpStatus === 404) {
    return <Networking state="crd-absent" sampleData={false} data={ingressOnlyData} />;
  }

  if (gatewayHttpStatus === 403 || httpRouteHttpStatus === 403) {
    return <Networking state="rbac-denied" sampleData={false} data={ingressOnlyData} />;
  }

  const isLoading = !namespace || gatewayWatch.isLoading || httpRouteWatch.isLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const state = data.gateways.length === 0 && data.httpRoutes.length === 0 ? "empty" : "ok";

  return <Networking data={data} state={state} sampleData={false} metrics={exposureMetrics} />;
}
