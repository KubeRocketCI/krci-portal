import { EventListener, Trigger } from "@my-project/shared";

/**
 * A `metav1.LabelSelector.matchExpressions` entry. `operator` is a plain string
 * rather than a union because the API may serve an operator this client does
 * not know about — evaluation degrades explicitly instead of the type system
 * pretending the set is closed.
 */
export type LabelSelectorRequirement = {
  key: string;
  operator: string;
  values?: string[];
};

export type ParsedLabelSelector = {
  matchLabels: Record<string, string>;
  matchExpressions: LabelSelectorRequirement[];
  /** An empty selector is inactive here — it selects nothing, not everything. */
  active: boolean;
  unsupportedOperators: string[];
};

const SUPPORTED_OPERATORS = new Set(["In", "NotIn", "Exists", "DoesNotExist"]);

const toRequirement = (value: unknown): LabelSelectorRequirement | null => {
  if (typeof value !== "object" || value === null) return null;
  const { key, operator, values } = value as Record<string, unknown>;
  if (typeof key !== "string" || typeof operator !== "string") return null;
  return {
    key,
    operator,
    values: Array.isArray(values) ? values.filter((v): v is string => typeof v === "string") : undefined,
  };
};

export const parseLabelSelector = (eventListener: EventListener): ParsedLabelSelector => {
  const selector = eventListener.spec?.labelSelector;
  const matchLabels = Object.fromEntries(
    Object.entries(selector?.matchLabels ?? {}).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
  const rawExpressions: unknown = selector?.matchExpressions;
  const matchExpressions = (Array.isArray(rawExpressions) ? rawExpressions : [])
    .map(toRequirement)
    .filter((r): r is LabelSelectorRequirement => r !== null);

  return {
    matchLabels,
    matchExpressions,
    active: Object.keys(matchLabels).length > 0 || matchExpressions.length > 0,
    unsupportedOperators: Array.from(
      new Set(matchExpressions.map((r) => r.operator).filter((op) => !SUPPORTED_OPERATORS.has(op)))
    ),
  };
};

/**
 * Namespaces the EventListener selects Triggers from beyond its own — the
 * portal watches only its own namespace, so a non-empty result means the
 * topology is necessarily partial. `"*"` is preserved verbatim; Tekton reads it
 * as every namespace.
 */
export const otherSelectedNamespaces = (eventListener: EventListener): string[] => {
  const raw: unknown = eventListener.spec?.namespaceSelector?.matchNames;
  const own = eventListener.metadata.namespace;
  const names = (Array.isArray(raw) ? raw : []).filter((n): n is string => typeof n === "string");
  return Array.from(new Set(names.filter((n) => n !== own)));
};

const formatRequirement = (requirement: LabelSelectorRequirement): string => {
  const values = (requirement.values ?? []).join(", ");
  switch (requirement.operator) {
    case "In":
      return `${requirement.key} in (${values})`;
    case "NotIn":
      return `${requirement.key} notin (${values})`;
    case "Exists":
      return requirement.key;
    case "DoesNotExist":
      return `!${requirement.key}`;
    default:
      return `${requirement.key} ${requirement.operator}${values ? ` (${values})` : ""}`;
  }
};

/** One `kubectl`-syntax term per matchLabels pair, then one per matchExpression. */
export const labelSelectorTerms = (selector: ParsedLabelSelector): string[] => [
  ...Object.entries(selector.matchLabels).map(([key, value]) => `${key}=${value}`),
  ...selector.matchExpressions.map(formatRequirement),
];

/** `null` — not `false` — when the operator is unknown, so callers can tell "no" from "cannot say". */
const matchesRequirement = (
  labels: Record<string, string | undefined> | undefined,
  requirement: LabelSelectorRequirement
): boolean | null => {
  const value = labels?.[requirement.key];
  const values = requirement.values ?? [];
  switch (requirement.operator) {
    case "In":
      return value !== undefined && values.includes(value);
    case "NotIn":
      return value === undefined || !values.includes(value);
    case "Exists":
      return value !== undefined;
    case "DoesNotExist":
      return value === undefined;
    default:
      return null;
  }
};

/**
 * Kubernetes AND-semantics: every matchLabels pair and every matchExpression
 * must hold. An unevaluable requirement counts as a non-match so the diagram
 * never claims a Trigger fires when it cannot prove it — callers report the
 * unsupported operator as a coverage gap instead.
 */
export const triggerMatchesSelector = (trigger: Trigger, selector: ParsedLabelSelector): boolean => {
  const labels = trigger.metadata.labels;
  const labelsMatch = Object.entries(selector.matchLabels).every(([key, value]) => labels?.[key] === value);
  return labelsMatch && selector.matchExpressions.every((r) => matchesRequirement(labels, r) === true);
};
