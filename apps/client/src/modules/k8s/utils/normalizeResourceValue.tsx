import type { ReactNode } from "react";
import { NameValueTable } from "@/core/components/NameValueTable";

function isPrimitive(v: unknown): boolean {
  return v === null || v === undefined || typeof v === "string" || typeof v === "boolean" || typeof v === "number";
}

/**
 * Converts an arbitrary K8s field value into a renderable ReactNode.
 *
 * Strategy to avoid inception-style nested tables:
 * - Flat objects  (all values are primitives) → NameValueTable (one level only)
 * - Deep objects  (any value is object/array) → JSON code block
 * - Primitive arrays                          → comma-separated string
 * - Complex arrays                            → JSON code block
 * - JSON-encoded string                       → parsed and re-processed
 * - Plain scalar                              → string
 */
export function normalizeResourceValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean" || typeof value === "number") return String(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return normalizeResourceValue(JSON.parse(trimmed));
      } catch {
        // not valid JSON — fall through
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (value.every(isPrimitive)) return value.map(String).join(", ");
    return (
      <pre className="bg-muted text-muted-foreground/90 max-h-64 overflow-auto rounded p-2 text-xs break-all whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "—";

    // Only expand to a table when every value is a scalar — prevents nested tables
    if (entries.every(([, v]) => isPrimitive(v))) {
      return (
        <NameValueTable
          rows={entries.map(([k, v]) => ({
            name: k,
            value: v === null || v === undefined ? "—" : String(v),
          }))}
        />
      );
    }

    return (
      <pre className="bg-muted text-muted-foreground/90 max-h-64 overflow-auto rounded p-2 text-xs break-all whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}
