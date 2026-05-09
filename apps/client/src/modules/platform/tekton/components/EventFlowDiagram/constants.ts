export const NODE_KIND = {
  GIT_SOURCE: "gitSource",
  EVENT_LISTENER: "eventListener",
  TRIGGER: "trigger",
  INTERCEPTOR: "interceptor",
  TRIGGER_BINDING: "triggerBinding",
  TRIGGER_TEMPLATE: "triggerTemplate",
  PIPELINE: "pipeline",
} as const;

export type NodeKind = (typeof NODE_KIND)[keyof typeof NODE_KIND];

// Tailwind token classes per spec §8.6. Used by node renderers, legend chip, MiniMap.
export const NODE_KIND_TAILWIND: Record<NodeKind, string> = {
  [NODE_KIND.GIT_SOURCE]: "bg-muted text-muted-foreground",
  [NODE_KIND.EVENT_LISTENER]: "bg-primary/10 text-primary",
  [NODE_KIND.TRIGGER]: "bg-primary/10 text-primary",
  [NODE_KIND.INTERCEPTOR]: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  [NODE_KIND.TRIGGER_BINDING]: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  [NODE_KIND.TRIGGER_TEMPLATE]: "bg-primary/10 text-primary",
  [NODE_KIND.PIPELINE]: "bg-status-success/10 text-status-success",
};

// CSS custom properties consumed by MiniMap nodeColor (must read at render time
// from getComputedStyle to support dark mode toggling).
export const NODE_KIND_CSS_VAR: Record<NodeKind, string> = {
  [NODE_KIND.GIT_SOURCE]: "--muted-foreground",
  [NODE_KIND.EVENT_LISTENER]: "--primary",
  [NODE_KIND.TRIGGER]: "--primary",
  [NODE_KIND.INTERCEPTOR]: "--color-amber-500",
  [NODE_KIND.TRIGGER_BINDING]: "--color-purple-500",
  [NODE_KIND.TRIGGER_TEMPLATE]: "--primary",
  [NODE_KIND.PIPELINE]: "--status-success",
};

export const LEGEND_LABELS: Record<NodeKind, string> = {
  [NODE_KIND.GIT_SOURCE]: "Git source",
  [NODE_KIND.EVENT_LISTENER]: "EventListener",
  [NODE_KIND.TRIGGER]: "Trigger",
  [NODE_KIND.INTERCEPTOR]: "Interceptor",
  [NODE_KIND.TRIGGER_BINDING]: "TriggerBinding",
  [NODE_KIND.TRIGGER_TEMPLATE]: "TriggerTemplate",
  [NODE_KIND.PIPELINE]: "Pipeline",
};
