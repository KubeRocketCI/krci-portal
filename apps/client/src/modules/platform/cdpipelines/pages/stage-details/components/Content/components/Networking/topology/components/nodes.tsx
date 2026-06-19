import { Handle, Position } from "@xyflow/react";
import { Globe, DoorOpen, Spline, Server, ShieldCheck, Route, Box, Filter } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { HEALTH_TONE, HEALTH_DOT } from "../constants";
import type {
  GatewayNodeData,
  RouteNodeData,
  BackendNodeData,
  IngressNodeData,
  PodNodeData,
} from "../useTopologyGraphData";

const StatusDot = ({ health }: { health: keyof typeof HEALTH_DOT }) => (
  <span className={cn("inline-block size-2.5 shrink-0 rounded-full", HEALTH_DOT[health])} />
);

const PolicyBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="text-muted-foreground ml-auto inline-flex items-center gap-0.5 text-[11px]">
      <ShieldCheck className="size-3.5" />
      {count}
    </span>
  ) : null;

const shell = "rounded-lg border p-2.5 text-sm shadow-sm min-w-[150px] cursor-pointer transition-colors";

export const InternetNode = () => (
  <div className={cn(shell, HEALTH_TONE.neutral, "cursor-default")}>
    <Handle type="source" position={Position.Right} className="opacity-0" />
    <div className="text-muted-foreground flex items-center gap-2 font-medium">
      <Globe className="size-4" />
      <span>Internet</span>
    </div>
  </div>
);

export const GatewayNode = ({ data }: { data: GatewayNodeData }) => {
  const { gateway, health, policyCount } = data;
  return (
    <div className={cn(shell, HEALTH_TONE[health])}>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <div className="flex items-center gap-2 font-medium">
        <DoorOpen className="size-4 shrink-0" />
        <StatusDot health={health} />
        <span className="truncate">{gateway.name}</span>
        <PolicyBadge count={policyCount} />
      </div>
      <div className="text-muted-foreground mt-1 text-[11px]">Gateway · class: {gateway.gatewayClassName}</div>
      <div className="text-muted-foreground mt-1 font-mono text-[11px]">
        {gateway.listeners.map((l) => `${l.protocol}:${l.port}`).join(" · ")}
      </div>
    </div>
  );
};

const FilterBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-blue-500">
      <Filter className="size-3" />
      {count}
    </span>
  ) : null;

export const RouteNode = ({ data }: { data: RouteNodeData }) => {
  const { route, health, host, policyCount, filterCount } = data;
  return (
    <div className={cn(shell, HEALTH_TONE[health])}>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <div className="flex items-center gap-2 font-medium">
        <Spline className="size-4 shrink-0" />
        <StatusDot health={health} />
        <span className="truncate">{route.name}</span>
        <PolicyBadge count={policyCount} />
        <FilterBadge count={filterCount} />
      </div>
      <div className="text-muted-foreground mt-1 text-[11px]">HTTPRoute</div>
      <div className="text-muted-foreground mt-1 truncate font-mono text-[11px]">{host}</div>
    </div>
  );
};

export const IngressNode = ({ data }: { data: IngressNodeData }) => (
  <div className={cn(shell, HEALTH_TONE[data.health])}>
    <Handle type="target" position={Position.Left} className="opacity-0" />
    <Handle type="source" position={Position.Right} className="opacity-0" />
    <div className="flex items-center gap-2 font-medium">
      <Route className="size-4 shrink-0" />
      <span className="truncate">{data.ingress.name}</span>
    </div>
    <div className="text-muted-foreground mt-1 text-[11px]">
      Ingress{data.ingress.ingressClassName ? ` · class: ${data.ingress.ingressClassName}` : ""}
    </div>
    <div className="text-muted-foreground mt-1 truncate font-mono text-[11px]">
      {data.ingress.rules[0]?.host ?? "*"}
    </div>
  </div>
);

export const BackendNode = ({ data }: { data: BackendNodeData }) => (
  <div className={cn(shell, HEALTH_TONE[data.health], "cursor-default")}>
    <Handle type="target" position={Position.Left} className="opacity-0" />
    <Handle type="source" position={Position.Right} className="opacity-0" />
    <div className="flex items-center gap-2 font-medium">
      <Server className="size-4 shrink-0" />
      <span className="truncate">{data.name}</span>
    </div>
    <div className="text-muted-foreground mt-1 font-mono text-[11px]">Service · :{data.port}</div>
  </div>
);

export const PodNode = ({ data }: { data: PodNodeData }) => (
  <div className={cn(shell, HEALTH_TONE[data.health], "min-w-[120px] cursor-default px-2 py-1.5 text-xs")}>
    <Handle type="target" position={Position.Left} className="opacity-0" />
    <div className="flex items-center gap-1.5">
      <Box className="size-3.5 shrink-0" />
      <span className={cn("inline-block size-2 shrink-0 rounded-full", HEALTH_DOT[data.health])} />
      <span className="truncate font-mono text-[11px]">{data.pod.name}</span>
    </div>
    <div className="text-muted-foreground mt-0.5 text-[10px]">
      Pod · {data.pod.status}
      {data.pod.restarts ? ` · ${data.pod.restarts}×` : ""}
    </div>
  </div>
);
