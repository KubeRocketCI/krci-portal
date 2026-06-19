import React from "react";
import { Copy, Filter, SquareArrowOutUpRight, XCircle } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import { Tooltip } from "@/core/components/ui/tooltip";
import type { NetGateway, NetHTTPRoute, NetPolicy, NetRouteFilter } from "../types";
import { aggregateFilters, deriveHTTPRouteURLs } from "../utils";
import { StatusPill } from "./StatusPill";

interface RouteCardProps {
  route: NetHTTPRoute;
  gateways: NetGateway[];
  policies: NetPolicy[];
  onSelect: (resource: NetHTTPRoute) => void;
}

export function RouteCard({ route, gateways, policies, onSelect }: RouteCardProps) {
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  const firstParentConditions = route.parentConditions[0]?.conditions ?? [];
  const accepted = firstParentConditions.find((c) => c.type === "Accepted");
  const resolvedRefs = firstParentConditions.find((c) => c.type === "ResolvedRefs");

  const resolvedRefsFailed = resolvedRefs?.status === "False";
  const resolvedRefsMessage = resolvedRefs?.message;

  const derivedURLs = deriveHTTPRouteURLs(route, gateways);
  const attachedPolicies = policies.filter((p) => p.targetName === route.name);

  const allFilters: NetRouteFilter[] = aggregateFilters(route.rules);

  const handleCopy = (url: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 1500);
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="cursor-pointer p-4 pb-2" onClick={() => onSelect(route)}>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base font-semibold hover:underline">{route.name}</CardTitle>
          {route.parentRefs.map((ref) => (
            <Badge key={ref.name} variant="outline" className="bg-muted text-muted-foreground text-xs">
              via {ref.name}
              {ref.sectionName ? ` / ${ref.sectionName}` : ""}
            </Badge>
          ))}
          {accepted && <StatusPill condition={accepted} label="Accepted" resourceGeneration={route.generation} />}
          {resolvedRefs && (
            <StatusPill condition={resolvedRefs} label="ResolvedRefs" resourceGeneration={route.generation} />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4 pt-2">
        {resolvedRefsFailed && (
          <div className="flex items-start gap-2 text-xs">
            <XCircle className="text-destructive mt-0.5 size-4 shrink-0" />
            <span className="text-destructive">
              ResolvedRefs=False: {resolvedRefs?.reason ?? "Unknown"} —{" "}
              {resolvedRefsMessage ?? "Backend reference could not be resolved"}
            </span>
          </div>
        )}

        <div>
          <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">Routing Rules</div>
          <TableUI>
            <TableHeaderUI>
              <TableRowUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Hostname</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Path</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Backend</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Port</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Weight</TableHeadUI>
              </TableRowUI>
            </TableHeaderUI>
            <TableBodyUI>
              {route.rules.map((rule, i) => (
                <TableRowUI key={i}>
                  <TableCellUI className="px-3 py-2 font-mono text-xs">
                    {rule.hostnames[0] ?? route.hostnames[0] ?? "*"}
                  </TableCellUI>
                  <TableCellUI className="px-3 py-2 font-mono text-xs">
                    <span className="text-muted-foreground text-[10px]">
                      {rule.pathType === "PathPrefix" ? "Prefix" : (rule.pathType ?? "")}
                    </span>{" "}
                    {rule.pathValue ?? "/"}
                  </TableCellUI>
                  <TableCellUI className="px-3 py-2 font-mono text-xs">{rule.backendName || "—"}</TableCellUI>
                  <TableCellUI className="px-3 py-2 font-mono text-xs">
                    {rule.backendName ? rule.backendPort : "—"}
                  </TableCellUI>
                  <TableCellUI className="px-3 py-2 text-xs">
                    {rule.showWeight && rule.weight !== undefined ? `${rule.weight}%` : "—"}
                  </TableCellUI>
                </TableRowUI>
              ))}
            </TableBodyUI>
          </TableUI>
        </div>

        {allFilters.length > 0 && (
          <div>
            <div className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium tracking-wide uppercase">
              <Filter className="size-3" />
              Filters
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allFilters.map((f, i) => (
                <Tooltip key={i} title={f.summary} placement="top">
                  <Badge
                    variant="outline"
                    className="cursor-default border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  >
                    {f.type}
                  </Badge>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {derivedURLs.length > 0 && !resolvedRefsFailed ? (
          <div className="flex flex-col gap-1.5">
            {derivedURLs.map(({ url, healthy }) => (
              <div key={url} className="flex items-center gap-2">
                <SquareArrowOutUpRight className={healthy ? "size-3.5 text-green-600" : "size-3.5 text-amber-600"} />
                <span className="font-mono text-xs">{url}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleCopy(url)}>
                  <Copy className="mr-1 size-3" />
                  {copiedUrl === url ? "Copied!" : "Copy"}
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <SquareArrowOutUpRight className="mr-1 size-3" />
                    Open
                  </a>
                </Button>
              </div>
            ))}
          </div>
        ) : resolvedRefsFailed ? (
          <p className="text-muted-foreground text-xs">(no URL CTAs — ResolvedRefs=False)</p>
        ) : null}

        {attachedPolicies.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="policies">
              <AccordionTrigger className="px-0 py-2 text-xs font-medium">
                Attached Policies ({attachedPolicies.length})
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-1 pb-0">
                <div className="flex flex-wrap gap-1.5">
                  {attachedPolicies.map((p) => {
                    const accepted = p.ancestorConditions.find((c) => c.type === "Accepted");
                    const isAccepted = accepted?.status === "True";
                    return (
                      <Badge
                        key={p.name}
                        variant="outline"
                        className={
                          isAccepted
                            ? "border-green-500/40 bg-green-500/10 text-green-700"
                            : "border-destructive/40 bg-destructive/10 text-destructive"
                        }
                      >
                        {p.kind}: {p.name}
                      </Badge>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
