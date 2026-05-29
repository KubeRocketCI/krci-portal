/**
 * Minimal JSONPath subset used by Custom Resource printer columns.
 *
 * Supported syntax:
 *   - Dot-delimited paths:                    `.status.phase`, `.spec.replicas`
 *   - Numeric array indexing:                 `.status.conditions[0].type`
 *   - String-key bracket access (quoted):     `.metadata.labels["app.kubernetes.io/name"]`
 *   - String-key bracket access (single):     `.metadata.labels['app']`
 *
 * NOT supported (returns undefined + dev warning):
 *   - Filter expressions:                     `.status.conditions[?(@.type=="Ready")]`
 *   - Wildcard:                               `.spec.containers[*].image`
 *   - Recursive descent:                      `..type`
 */

// Match either a dot-segment ".foo", a bracket numeric "[0]", or a quoted string "['app']" / '["app"]'.
const SEGMENT_RE = /\.([A-Za-z_$][A-Za-z0-9_$-]*)|\[(\d+)\]|\[(?:'([^']*)'|"([^"]*)")\]/g;
// Detect bracket forms that this parser does NOT support so we can return early.
const UNSUPPORTED_BRACKET_RE = /\[(?:\?|\*)/;

function emitDevWarning(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[extractByJsonPath] ${message}`);
  }
}

export function extractByJsonPath(item: unknown, path: string): unknown {
  if (UNSUPPORTED_BRACKET_RE.test(path)) {
    emitDevWarning(`unsupported syntax (filter or wildcard) — returning blank: ${path}`);
    return undefined;
  }

  // Tolerate a missing leading dot: callers historically passed both "status.phase"
  // and ".status.phase". Normalize to the spec form before scanning.
  const normalizedPath = path.startsWith(".") || path.startsWith("[") ? path : `.${path}`;

  const segments: string[] = [];
  SEGMENT_RE.lastIndex = 0;
  let consumedTo = 0;
  let match: RegExpExecArray | null;
  while ((match = SEGMENT_RE.exec(normalizedPath)) !== null) {
    if (match.index !== consumedTo) {
      // A character outside the recognized grammar appeared between matches.
      emitDevWarning(`unparsable path — returning blank: ${path}`);
      return undefined;
    }
    consumedTo = match.index + match[0].length;
    // match[1] = dot segment, match[2] = numeric index, match[3] = single-quoted, match[4] = double-quoted
    segments.push(match[1] ?? match[2] ?? match[3] ?? match[4] ?? "");
  }
  if (consumedTo !== normalizedPath.length) {
    // Trailing characters did not match any known segment form.
    emitDevWarning(`unparsable path — returning blank: ${path}`);
    return undefined;
  }
  if (segments.length === 0) return undefined;

  let cur: unknown = item;
  for (const seg of segments) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx)) return undefined;
      cur = cur[idx];
    } else if (typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return cur;
}
