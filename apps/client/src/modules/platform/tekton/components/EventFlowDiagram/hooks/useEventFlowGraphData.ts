import React from "react";
import { Edge, MarkerType, Node } from "@xyflow/react";
import type { Trigger, PipelineRun, GitServer } from "@my-project/shared";
import {
  EventListenerTopology,
  ResolvedTriggerNode,
  ResolutionStatus,
} from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { NODE_KIND, NodeKind } from "../constants";
import { getLayoutedElements } from "../utils/layoutUtils";

// Typed data shapes for each node kind
export type GitSourceNodeData = { gitServer: NonNullable<GitServer> };
export type EventListenerNodeData = {
  eventListener: EventListenerTopology["eventListener"];
  ready: boolean;
  address: string | null;
  triggerCount: number;
};
export type TriggerNodeData = {
  triggerRef: string;
  resolved: Trigger | null;
  status: ResolutionStatus;
  namespace: string;
};
export type InterceptorNodeData = { interceptor: ResolvedTriggerNode["interceptors"][number]; namespace: string };
export type TriggerBindingNodeData = { binding: ResolvedTriggerNode["bindings"][number]; namespace: string };
export type TriggerTemplateNodeData = { template: ResolvedTriggerNode["template"]; namespace: string };
export type PipelineNodeData = {
  pipelineRef: ResolvedTriggerNode["template"]["pipelineRef"];
  latestPipelineRun: PipelineRun | null;
  namespace: string;
};

// Typed node variants
type TypedNode<TData extends Record<string, unknown>, TType extends NodeKind> = Node<TData, TType>;

export type GitSourceFlowNode = TypedNode<GitSourceNodeData, typeof NODE_KIND.GIT_SOURCE>;
export type EventListenerFlowNode = TypedNode<EventListenerNodeData, typeof NODE_KIND.EVENT_LISTENER>;
export type TriggerFlowNode = TypedNode<TriggerNodeData, typeof NODE_KIND.TRIGGER>;
export type InterceptorFlowNode = TypedNode<InterceptorNodeData, typeof NODE_KIND.INTERCEPTOR>;
export type TriggerBindingFlowNode = TypedNode<TriggerBindingNodeData, typeof NODE_KIND.TRIGGER_BINDING>;
export type TriggerTemplateFlowNode = TypedNode<TriggerTemplateNodeData, typeof NODE_KIND.TRIGGER_TEMPLATE>;
export type PipelineFlowNode = TypedNode<PipelineNodeData, typeof NODE_KIND.PIPELINE>;

export type FlowNode =
  | GitSourceFlowNode
  | EventListenerFlowNode
  | TriggerFlowNode
  | InterceptorFlowNode
  | TriggerBindingFlowNode
  | TriggerTemplateFlowNode
  | PipelineFlowNode;

const triggerKey = (entry: ResolvedTriggerNode, idx: number) => {
  const base = entry.source.kind === "triggerRef" ? entry.source.ref : entry.source.name || "inline";
  return `${base}-${idx}`;
};

export const buildNodes = (topology: EventListenerTopology): FlowNode[] => {
  const nodes: FlowNode[] = [];

  if (topology.gitServer) {
    nodes.push({
      id: "node::gitSource",
      type: NODE_KIND.GIT_SOURCE,
      data: { gitServer: topology.gitServer },
      position: { x: 0, y: 0 },
    });
  }

  nodes.push({
    id: "node::eventListener",
    type: NODE_KIND.EVENT_LISTENER,
    data: {
      eventListener: topology.eventListener,
      ready: topology.ready,
      address: topology.address,
      triggerCount: topology.triggers.length,
    },
    position: { x: 0, y: 0 },
  });

  topology.triggers.forEach((entry, idx) => {
    const key = triggerKey(entry, idx);

    if (entry.source.kind === "triggerRef") {
      nodes.push({
        id: `node::trigger::${key}`,
        type: NODE_KIND.TRIGGER,
        data: {
          triggerRef: entry.source.ref,
          resolved: entry.source.resolved,
          status: entry.source.status,
          namespace: topology.eventListener.metadata.namespace ?? "",
        },
        position: { x: 0, y: 0 },
      });
    }

    entry.interceptors.forEach((i, iIdx) => {
      nodes.push({
        id: `node::interceptor::${key}::${iIdx}`,
        type: NODE_KIND.INTERCEPTOR,
        data: { interceptor: i, namespace: topology.eventListener.metadata.namespace ?? "" },
        position: { x: 0, y: 0 },
      });
    });

    entry.bindings.forEach((b, bIdx) => {
      nodes.push({
        id: `node::binding::${key}::${bIdx}`,
        type: NODE_KIND.TRIGGER_BINDING,
        data: { binding: b, namespace: topology.eventListener.metadata.namespace ?? "" },
        position: { x: 0, y: 0 },
      });
    });

    nodes.push({
      id: `node::template::${key}`,
      type: NODE_KIND.TRIGGER_TEMPLATE,
      data: { template: entry.template, namespace: topology.eventListener.metadata.namespace ?? "" },
      position: { x: 0, y: 0 },
    });

    nodes.push({
      id: `node::pipeline::${key}`,
      type: NODE_KIND.PIPELINE,
      data: {
        pipelineRef: entry.template.pipelineRef,
        latestPipelineRun: entry.latestPipelineRun,
        namespace: topology.eventListener.metadata.namespace ?? "",
      },
      position: { x: 0, y: 0 },
    });
  });

  return nodes;
};

export const buildEdges = (topology: EventListenerTopology): Edge[] => {
  const edges: Edge[] = [];
  const opts = {
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    style: { strokeWidth: 1.5 },
  };

  if (topology.gitServer) {
    edges.push({ id: "edge::git→el", source: "node::gitSource", target: "node::eventListener", ...opts });
  }

  topology.triggers.forEach((entry, idx) => {
    const key = triggerKey(entry, idx);
    const firstInterceptorId = entry.interceptors.length ? `node::interceptor::${key}::0` : null;
    const templateId = `node::template::${key}`;
    const pipelineId = `node::pipeline::${key}`;

    if (entry.source.kind === "triggerRef") {
      edges.push({
        id: `edge::el→trigger::${key}`,
        source: "node::eventListener",
        target: `node::trigger::${key}`,
        label: entry.source.ref,
        ...opts,
      });
      const tail = firstInterceptorId ?? (entry.bindings.length ? `node::binding::${key}::0` : templateId);
      edges.push({ id: `edge::trigger→${tail}`, source: `node::trigger::${key}`, target: tail, ...opts });
    } else {
      const tail = firstInterceptorId ?? (entry.bindings.length ? `node::binding::${key}::0` : templateId);
      edges.push({
        id: `edge::el→${tail}::${key}`,
        source: "node::eventListener",
        target: tail,
        label: entry.source.name || undefined,
        ...opts,
      });
    }

    for (let i = 0; i < entry.interceptors.length - 1; i += 1) {
      edges.push({
        id: `edge::interceptor::${key}::${i}→${i + 1}`,
        source: `node::interceptor::${key}::${i}`,
        target: `node::interceptor::${key}::${i + 1}`,
        ...opts,
      });
    }

    const lastInterceptorId = entry.interceptors.length
      ? `node::interceptor::${key}::${entry.interceptors.length - 1}`
      : null;

    const noInterceptorBindingSourceId = !lastInterceptorId
      ? entry.source.kind === "triggerRef"
        ? `node::trigger::${key}`
        : "node::eventListener"
      : null;

    entry.bindings.forEach((_, bIdx) => {
      const bindingId = `node::binding::${key}::${bIdx}`;
      if (lastInterceptorId) {
        edges.push({
          id: `edge::lastInterceptor→binding::${key}::${bIdx}`,
          source: lastInterceptorId,
          target: bindingId,
          ...opts,
        });
      } else if (bIdx > 0 && noInterceptorBindingSourceId) {
        edges.push({
          id: `edge::source→binding::${key}::${bIdx}`,
          source: noInterceptorBindingSourceId,
          target: bindingId,
          ...opts,
        });
      }
      edges.push({ id: `edge::binding→template::${key}::${bIdx}`, source: bindingId, target: templateId, ...opts });
    });

    if (!entry.bindings.length && lastInterceptorId) {
      edges.push({
        id: `edge::lastInterceptor→template::${key}`,
        source: lastInterceptorId,
        target: templateId,
        ...opts,
      });
    }

    edges.push({ id: `edge::template→pipeline::${key}`, source: templateId, target: pipelineId, ...opts });
  });

  return edges;
};

export interface UseEventFlowGraphDataResult {
  nodes: FlowNode[];
  edges: Edge[];
}

export function useEventFlowGraphData(
  topology: EventListenerTopology,
  direction: "LR" | "TB"
): UseEventFlowGraphDataResult {
  return React.useMemo(
    () => getLayoutedElements(buildNodes(topology), buildEdges(topology), direction),
    [topology, direction]
  );
}
