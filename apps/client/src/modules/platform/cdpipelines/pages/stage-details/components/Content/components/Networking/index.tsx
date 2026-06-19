import React from "react";
import { Search, Workflow, List } from "lucide-react";
import { Alert } from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";
import { Separator } from "@/core/components/ui/separator";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import type { NetGateway, NetHTTPRoute, NetIngress, NetworkingData } from "./types";
import type { ExposureMetrics } from "./live/useExposureMetrics";
import { mockPopulated } from "./mock";
import { GatewayCard } from "./components/GatewayCard";
import { RouteCard } from "./components/RouteCard";
import { IngressCard } from "./components/IngressCard";
import { InlineCode } from "./components/InlineCode";
import { DetailDrawer } from "./components/DetailDrawer";
import { Legend } from "./components/Legend";
import { SummaryTiles } from "./components/SummaryTiles";
import { NetworkTopology } from "./topology/NetworkTopology";

type NetworkingState = "ok" | "empty" | "crd-absent" | "rbac-denied";
type NetworkingView = "graph" | "list";
type SelectedResource = NetGateway | NetHTTPRoute | NetIngress | null;

interface NetworkingProps {
  data?: NetworkingData;
  state?: NetworkingState;
  /** Graph (Kiali-style topology, default) or List (dense cards). */
  defaultView?: NetworkingView;
  /** Pre-select a resource so the detail drawer opens on mount (future: deep-link from a URL param). */
  initialSelected?: SelectedResource;
  /** When set, scope the whole tab to one Application's exposure path (deployment-view variant). */
  appName?: string;
  /** Show the "sample data" banner (Storybook/mock). Live container passes false. */
  sampleData?: boolean;
  /** Live Prometheus exposure metrics from useExposureMetrics — undefined in Storybook. */
  metrics?: ExposureMetrics;
}

export function Networking({
  data = mockPopulated,
  state = "ok",
  defaultView = "graph",
  initialSelected = null,
  appName,
  sampleData = true,
  metrics,
}: NetworkingProps) {
  const [view, setView] = React.useState<NetworkingView>(defaultView);
  const [showErrorsOnly, setShowErrorsOnly] = React.useState(false);
  const [filterText, setFilterText] = React.useState("");
  const [selected, setSelected] = React.useState<SelectedResource>(initialSelected);

  const handleSelect = (resource: SelectedResource) => {
    setSelected(resource);
  };

  const handleCloseDrawer = () => {
    setSelected(null);
  };

  const matchesFilter = (text: string) => {
    if (!filterText) return true;
    return text.toLowerCase().includes(filterText.toLowerCase());
  };

  const gatewayHasError = (gw: NetGateway) =>
    gw.conditions.some((c) => c.status === "False" && c.reason !== "AddressNotAssigned");

  const routeHasError = (r: NetHTTPRoute) =>
    r.parentConditions.some((pc) => pc.conditions.some((c) => c.status === "False"));

  const visibleGateways = data.gateways.filter((gw) => {
    if (showErrorsOnly && !gatewayHasError(gw)) return false;
    return matchesFilter(gw.name);
  });

  const visibleRoutes = data.httpRoutes.filter((r) => {
    if (showErrorsOnly && !routeHasError(r)) return false;
    return (
      matchesFilter(r.name) ||
      r.hostnames.some((h) => matchesFilter(h)) ||
      r.rules.some((rule) => matchesFilter(rule.backendName) || matchesFilter(rule.pathValue ?? ""))
    );
  });

  const visibleIngresses = data.ingresses.filter((i) => {
    return (
      matchesFilter(i.name) || i.rules.some((r) => matchesFilter(r.host ?? "") || matchesFilter(r.backendName ?? ""))
    );
  });

  return (
    <div className="flex flex-col gap-6 p-4">
      {sampleData && <Alert title="DRAFT — sample data">This preview renders mock/sample data (Storybook only).</Alert>}

      {state === "crd-absent" && (
        <Alert title="Some resources aren't shown">
          <p>
            The Gateway API (<InlineCode>gateway.networking.k8s.io</InlineCode>) isn't installed on this cluster, so
            Gateways and HTTPRoutes can't be listed.
          </p>
        </Alert>
      )}

      {state === "rbac-denied" && (
        <Alert title="Some resources might be hidden">
          <p>
            You don't have permission to list Gateways or HTTPRoutes in this namespace, so they're omitted here. Ask
            your cluster administrator to grant <InlineCode>get/list/watch</InlineCode> on{" "}
            <InlineCode>gateway.networking.k8s.io</InlineCode>
          </p>
        </Alert>
      )}

      {appName ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Exposure for application</span>
          <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-medium">{appName}</span>
        </div>
      ) : (
        <SummaryTiles data={data} />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <ToggleButtonGroup
          aria-label="View"
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v as NetworkingView)}
          size="sm"
        >
          <ToggleButton value="graph">
            <Workflow className="mr-1 size-3.5" />
            Graph
          </ToggleButton>
          <ToggleButton value="list">
            <List className="mr-1 size-3.5" />
            List
          </ToggleButton>
        </ToggleButtonGroup>
        {view === "list" && (
          <>
            <Button
              variant={showErrorsOnly ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowErrorsOnly((v) => !v)}
            >
              {showErrorsOnly ? "✗ Errors only" : "Show errors only"}
            </Button>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
              <input
                type="text"
                placeholder="hostname, path, route, backend..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="border-input bg-background placeholder:text-muted-foreground h-7 rounded-md border py-1 pr-3 pl-7 text-xs focus:ring-1 focus:outline-none"
              />
            </div>
          </>
        )}
      </div>

      {view === "graph" &&
        (data.gateways.length > 0 || data.ingresses.length > 0 ? (
          <div className="bg-card/20 h-[68vh] min-h-[460px] w-full overflow-hidden rounded-lg border">
            <NetworkTopology
              data={data}
              onSelect={handleSelect}
              appName={appName}
              initialShowPods={!!appName}
              metrics={metrics}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No Gateway API or Ingress resources to graph in this namespace.
          </p>
        ))}

      {view === "list" && state !== "crd-absent" && state !== "rbac-denied" && (
        <>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold">Gateways</span>
              <Separator className="flex-1" />
            </div>
            {data.gateways.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No Gateway resources found in this namespace. This stage does not use the Kubernetes Gateway API.
              </p>
            ) : visibleGateways.length === 0 ? (
              <p className="text-muted-foreground text-sm">No gateways match the current filter.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {visibleGateways.map((gw) => (
                  <GatewayCard key={gw.name} gateway={gw} policies={data.policies} onSelect={handleSelect} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold">HTTPRoutes</span>
              <Separator className="flex-1" />
            </div>
            {data.httpRoutes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No HTTPRoute resources found in this namespace.</p>
            ) : visibleRoutes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No routes match the current filter.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {visibleRoutes.map((route) => (
                  <RouteCard
                    key={route.name}
                    route={route}
                    gateways={data.gateways}
                    policies={data.policies}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === "list" && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-semibold">Ingresses</span>
            <Separator className="flex-1" />
          </div>
          {data.ingresses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Ingress resources found in this namespace.</p>
          ) : visibleIngresses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No ingresses match the current filter.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleIngresses.map((ingress) => (
                <IngressCard key={ingress.name} ingress={ingress} onSelect={handleSelect} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === "list" && <Legend />}

      <DetailDrawer resource={selected} gateways={data.gateways} policies={data.policies} onClose={handleCloseDrawer} />
    </div>
  );
}
