import React from "react";
import { Copy, Filter, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/core/components/ui/sheet";
import { Separator } from "@/core/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { Badge } from "@/core/components/ui/badge";
import type { NetGateway, NetHTTPRoute, NetIngress, NetPolicy, NetRouteFilter } from "../types";
import { aggregateFilters, deriveHTTPRouteURLs } from "../utils";
import { StatusPill } from "./StatusPill";

type SelectedResource = NetGateway | NetHTTPRoute | NetIngress | null;

function isGateway(r: SelectedResource): r is NetGateway {
  return r !== null && "listeners" in r;
}
function isHTTPRoute(r: SelectedResource): r is NetHTTPRoute {
  return r !== null && "parentConditions" in r;
}
function isIngress(r: SelectedResource): r is NetIngress {
  return (r !== null && "ingressClassName" in r) || (r !== null && !("listeners" in r) && !("parentConditions" in r));
}

interface DetailDrawerProps {
  resource: SelectedResource;
  gateways: NetGateway[];
  policies: NetPolicy[];
  onClose: () => void;
}

export function DetailDrawer({ resource, gateways, policies, onClose }: DetailDrawerProps) {
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  const handleCopy = (url: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 1500);
    });
  };

  const resourceName = resource?.name ?? "";
  const resourceNs = resource ? ("namespace" in resource ? resource.namespace : "") : "";

  const kind = isGateway(resource)
    ? "Gateway"
    : isHTTPRoute(resource)
      ? "HTTPRoute"
      : resource !== null
        ? "Ingress"
        : "";

  const derivedURLs = isHTTPRoute(resource) ? deriveHTTPRouteURLs(resource, gateways) : [];
  const attachedPolicies = resource ? policies.filter((p) => p.targetName === resource.name) : [];

  return (
    <Sheet open={resource !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-2">
          <SheetTitle>
            {kind} · {resourceName}
          </SheetTitle>
          <SheetDescription>ns: {resourceNs}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {isGateway(resource) && (
            <>
              <Separator />
              <section>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Status Conditions
                </p>
                <div className="flex flex-col gap-1.5">
                  {resource.conditions.map((c) => (
                    <div key={c.type} className="flex items-center gap-2">
                      <StatusPill condition={c} resourceGeneration={resource.generation} />
                      {c.message && <span className="text-muted-foreground text-xs">{c.message}</span>}
                    </div>
                  ))}
                </div>
              </section>

              <Separator />
              <section>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Address</p>
                {resource.addresses.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {resource.addresses.map((a) => (
                      <span key={`${a.type}:${a.value}`} className="bg-muted rounded px-2 py-0.5 font-mono text-xs">
                        {a.type}: {a.value}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    No assigned address (reachable via the Envoy Service ClusterIP/NodePort).
                  </p>
                )}
              </section>

              <Separator />
              <section>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Listeners ({resource.listeners.length})
                </p>
                <div className="flex flex-col gap-2">
                  {resource.listeners.map((l) => (
                    <div key={l.name} className="bg-muted/50 rounded-md p-3 text-xs">
                      <div className="mb-1 font-medium">
                        {l.name} — {l.protocol}:{l.port}
                        {l.hostname ? ` (${l.hostname})` : ""}
                        {l.tlsSecret ? ` [Secret: ${l.tlsSecret}]` : ""}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {l.conditions.map((c) => (
                          <StatusPill key={c.type} condition={c} resourceGeneration={resource.generation} />
                        ))}
                      </div>
                      <div className="text-muted-foreground mt-1">Attached routes: {l.attachedRoutes}</div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {isHTTPRoute(resource) && (
            <>
              <Separator />
              <section>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Status Conditions
                </p>
                <div className="flex flex-col gap-2">
                  {resource.parentConditions.map((pc) => (
                    <div key={pc.parentName}>
                      <p className="text-muted-foreground mb-1 text-xs">Parent: {pc.parentName}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pc.conditions.map((c) => (
                          <div key={c.type} className="flex items-center gap-2">
                            <StatusPill condition={c} resourceGeneration={resource.generation} />
                            {c.message && <span className="text-muted-foreground truncate text-xs">{c.message}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {resource.parentRefs.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Parent Gateway
                    </p>
                    {resource.parentRefs.map((ref) => {
                      const gw = gateways.find((g) => g.name === ref.name);
                      return (
                        <div key={ref.name} className="bg-muted/50 rounded-md p-3 text-xs">
                          <p className="font-medium">{ref.name}</p>
                          {gw && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {gw.conditions.map((c) => (
                                <StatusPill key={c.type} condition={c} resourceGeneration={gw.generation} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </section>
                </>
              )}

              {derivedURLs.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Derived URLs
                    </p>
                    <div className="flex flex-col gap-2">
                      {derivedURLs.map(({ url, healthy }) => (
                        <div key={url} className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <SquareArrowOutUpRight
                              className={healthy ? "size-3.5 text-green-600" : "size-3.5 text-amber-600"}
                            />
                            <span className="font-mono text-xs break-all">{url}</span>
                          </div>
                          <div className="flex gap-2 pl-5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleCopy(url)}
                            >
                              <Copy className="mr-1 size-3" />
                              {copiedUrl === url ? "Copied!" : "Copy URL"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-6 px-2 text-xs" asChild>
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <SquareArrowOutUpRight className="mr-1 size-3" />
                                Open in browser
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              <Separator />
              <section>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Routing Rules
                </p>
                <div className="flex flex-col gap-1">
                  {resource.rules.map((rule, i) => (
                    <div key={i} className="bg-muted/50 rounded px-3 py-2 font-mono text-xs">
                      <span className="text-muted-foreground">{rule.hostnames[0] ?? resource.hostnames[0] ?? "*"}</span>{" "}
                      {rule.pathValue ?? "/"} → {rule.backendName}:{rule.backendPort}
                      {rule.showWeight && rule.weight !== undefined && (
                        <span className="text-muted-foreground"> ({rule.weight}%)</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {(() => {
                const allFilters: NetRouteFilter[] = aggregateFilters(resource.rules);
                if (allFilters.length === 0) return null;
                return (
                  <>
                    <Separator />
                    <section>
                      <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
                        <Filter className="size-3" />
                        Filters
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {allFilters.map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Badge
                              variant="outline"
                              className="mt-0.5 shrink-0 border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            >
                              {f.type}
                            </Badge>
                            <span className="font-mono text-xs">{f.summary}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                );
              })()}
            </>
          )}

          {attachedPolicies.length > 0 && (
            <>
              <Separator />
              <section>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Attached Policies
                </p>
                <Accordion type="multiple">
                  {attachedPolicies.map((policy) => {
                    const accepted = policy.ancestorConditions.find((c) => c.type === "Accepted");
                    return (
                      <AccordionItem key={policy.name} value={policy.name}>
                        <AccordionTrigger className="py-2 text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <span>
                              {policy.kind} · {policy.name}
                            </span>
                            {accepted && <StatusPill condition={accepted} label="Accepted" />}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="flex flex-col gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground font-medium">Ancestor: </span>
                              {policy.targetName} ({policy.targetKind})
                            </div>
                            {policy.ancestorConditions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {policy.ancestorConditions.map((c) => (
                                  <StatusPill key={c.type} condition={c} label={c.type} />
                                ))}
                              </div>
                            )}
                            {policy.configSummary && (
                              <div className="bg-muted/50 rounded px-3 py-2 font-mono text-xs">
                                {policy.configSummary}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </section>
            </>
          )}

          {isIngress(resource) && (
            <>
              <Separator />
              <section>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Ingress Details
                </p>
                <div className="text-xs">
                  <p>
                    <span className="text-muted-foreground">Class:</span> {resource.ingressClassName ?? "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-muted-foreground">Rules:</span> {resource.rules.length}
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
