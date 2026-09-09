import DOMPurify from "dompurify";

/**
 * A sanitized icon ready for an `<img src>`, or the reason the stored value is unusable.
 *
 * `sanitized` reports that DOMPurify removed something. Renderers ignore it; the QuickLink
 * form surfaces it so an author learns their paste was stripped rather than silently altered.
 */
export type SvgIconDecodeResult =
  | { status: "absent" }
  | { status: "ok"; src: string; sanitized: boolean }
  | { status: "invalid"; reason: string };

const CACHE_LIMIT = 64;
const cache = new Map<string, SvgIconDecodeResult>();

// Header of a data URI up to its first comma. Base64 has no comma, so the payload is intact.
const DATA_URI_HEADER = /^data:image\/svg\+xml([^,]*),/i;

/** Splits off a data-URI wrapper, reporting whether its parameters declare base64. */
const stripDataUri = (icon: string): { payload: string; base64: boolean } => {
  const header = DATA_URI_HEADER.exec(icon);

  if (!header) {
    return { payload: icon, base64: true };
  }

  const parameters = header[1].split(";").map((parameter) => parameter.trim().toLowerCase());

  return { payload: icon.slice(header[0].length), base64: parameters.includes("base64") };
};

const decode = (icon: string): SvgIconDecodeResult => {
  // The field is a plain string, so operators and Helm charts write a bare payload or a data
  // URI. Any MIME parameter may sit before the base64 token: `;charset=utf-8;base64,`.
  const { payload, base64 } = stripDataUri(icon);

  if (!base64) {
    return { status: "invalid", reason: "data URI is not base64-encoded" };
  }

  let markup: string;

  try {
    // atob is already forgiving about whitespace and absent padding.
    const normalised = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(normalised), (char) => char.charCodeAt(0));
    markup = new TextDecoder().decode(bytes);
  } catch {
    return {
      status: "invalid",
      reason: icon.trimStart().startsWith("<") ? "expected base64, got raw SVG markup" : "not valid base64",
    };
  }

  const svg = DOMPurify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // The SVG profile permits these; each can load or run external content.
    FORBID_TAGS: ["script", "object", "embed", "foreignObject", "iframe"],
  });
  // Every call records the parser's own <body> wrapper. Anything else is a real removal.
  // The "reports a clean icon as untouched" test fails if that artifact ever changes.
  const sanitized = DOMPurify.removed.some(
    (entry) => (entry as { element?: { nodeName?: string } }).element?.nodeName !== "BODY"
  );

  // Checks the sanitized output rather than the raw prefix: a leading XML declaration is
  // legal, and anything that is not SVG is stripped to nothing by the profile above.
  if (!svg.includes("<svg")) {
    return { status: "invalid", reason: "decoded content is not an SVG" };
  }

  return { status: "ok", src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, sanitized };
};

/**
 * Decodes and sanitizes a base64-encoded SVG.
 *
 * Results are cached because decoding is pure and callers re-render on every watch event.
 * The cache is bounded and evicts in insertion order.
 */
export const decodeSvgIcon = (icon: string | undefined): SvgIconDecodeResult => {
  if (!icon) {
    return { status: "absent" };
  }

  const cached = cache.get(icon);

  if (cached) {
    return cached;
  }

  const result = decode(icon);

  if (cache.size >= CACHE_LIMIT) {
    cache.delete(cache.keys().next().value as string);
  }

  cache.set(icon, result);

  return result;
};

/**
 * Field-level validation for an icon the user is authoring.
 *
 * Returns an error message, or undefined when the value is usable as-is. An absent value is
 * the field's own concern, so it passes here.
 */
export const validateSvgIcon = (icon: string): string | undefined => {
  const result = decodeSvgIcon(icon);

  switch (result.status) {
    case "absent":
      return undefined;
    case "invalid":
      return `Invalid icon: ${result.reason}.`;
    case "ok":
      return result.sanitized ? "Icon contains forbidden elements or event handlers." : undefined;
  }
};
