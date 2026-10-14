/**
 * Framework-free validator for CEL filter strings sent to Tekton Results.
 *
 * Tekton Results feeds the filter to cel2sql without escaping, so a quote that
 * reaches the SQL layer inside a string literal is an injection vector. This
 * module rejects any filter whose string literals could carry a delimiter or
 * control character. Must stay importable from both the tRPC server and the
 * client, so it has no zod, trpc, or react imports.
 */

/** Maximum accepted filter length in characters. */
export const CEL_FILTER_MAX_LENGTH = 8192;

export type CELFilterViolation =
  | "too-long"
  | "disallowed-character"
  | "line-comment"
  | "unbalanced-brackets"
  | "unterminated-string"
  | "triple-quoted-string"
  | "prefixed-string"
  | "adjacent-string-literal"
  | "disallowed-string-content";

export type CELFilterValidation =
  | { valid: true }
  | { valid: false; violation: CELFilterViolation; position: number; message: string };

const UNSAFE_CONTENT_DESCRIPTION = "quotes, backticks, backslashes, or control characters";

const VIOLATION_MESSAGES: Record<CELFilterViolation, string> = {
  "too-long": `filter exceeds the maximum length of ${CEL_FILTER_MAX_LENGTH} characters`,
  "disallowed-character": "filter contains a disallowed character",
  "line-comment": "filter must not contain comments",
  "unbalanced-brackets": "filter has unbalanced parentheses or brackets",
  "unterminated-string": "filter has an unterminated string literal",
  "triple-quoted-string": "filter must not use triple-quoted string literals",
  "prefixed-string": "filter must not use prefixed string literals",
  "adjacent-string-literal": "adjacent string literals are not allowed",
  "disallowed-string-content": `string literals must not contain ${UNSAFE_CONTENT_DESCRIPTION}`,
};

// Characters allowed outside string literals: identifiers, spaces, member
// access, and CEL comparison/logical/arithmetic operators. Quotes and brackets
// are handled in the scan loop. Tab, newline, and other whitespace are rejected.
const ALLOWED_OPERATOR_CHAR = /^[A-Za-z0-9_ .!=<>&|+\-*/%,]$/;

// Word characters that mark a quote as a type-prefixed literal (r'…', b"…", rb'…').
const WORD_CHAR = /[A-Za-z0-9_]/;

// Content forbidden inside a string literal: the delimiter/backslash set plus
// control, format, and surrogate characters and the Unicode line/paragraph
// separators.
const UNSAFE_CEL_STRING_CONTENT = /['"`\\]|\p{Cc}|\p{Cf}|\p{Cs}|\u2028|\u2029/u;

function fail(violation: CELFilterViolation, position: number): CELFilterValidation {
  return { valid: false, violation, position, message: VIOLATION_MESSAGES[violation] };
}

/**
 * Validate a CEL filter with a single left-to-right pass.
 *
 * Accepts only identifiers, member access, bracketed indexing, CEL operators,
 * spaces, and single-quoted or double-quoted string literals whose content
 * passes {@link isSafeCELStringContent}. An empty string is valid.
 */
export function validateCELFilter(filter: string): CELFilterValidation {
  if (filter.length > CEL_FILTER_MAX_LENGTH) {
    return fail("too-long", 0);
  }

  const stack: Array<"(" | "["> = [];
  let i = 0;

  while (i < filter.length) {
    const char = filter[i];

    if (char === "'" || char === '"') {
      if (i > 0 && (filter[i - 1] === "'" || filter[i - 1] === '"')) {
        return fail("adjacent-string-literal", i);
      }
      if (i > 0 && WORD_CHAR.test(filter[i - 1])) {
        return fail("prefixed-string", i);
      }
      if (filter[i + 1] === char && filter[i + 2] === char) {
        return fail("triple-quoted-string", i);
      }
      const closing = filter.indexOf(char, i + 1);
      if (closing === -1) {
        return fail("unterminated-string", i);
      }
      const content = filter.substring(i + 1, closing);
      if (!isSafeCELStringContent(content)) {
        return fail("disallowed-string-content", i);
      }
      i = closing + 1;
      continue;
    }

    if (char === "/" && filter[i + 1] === "/") {
      return fail("line-comment", i);
    }

    if (char === "(" || char === "[") {
      stack.push(char);
      i++;
      continue;
    }

    if (char === ")" || char === "]") {
      const expectedOpen = char === ")" ? "(" : "[";
      if (stack[stack.length - 1] !== expectedOpen) {
        return fail("unbalanced-brackets", i);
      }
      stack.pop();
      i++;
      continue;
    }

    if (!ALLOWED_OPERATOR_CHAR.test(char)) {
      return fail("disallowed-character", i);
    }

    i++;
  }

  if (stack.length > 0) {
    return fail("unbalanced-brackets", filter.length);
  }

  return { valid: true };
}

/**
 * True when value is safe to place verbatim inside a CEL string literal: it
 * contains no single quote, double quote, backtick, or backslash, and no
 * Unicode control (Cc), format (Cf), or surrogate (Cs) character, nor
 * U+2028/U+2029. Every other character (including ASCII punctuation such as
 * `@`, `%`, `/`, and letters, marks, and numbers) is allowed.
 */
export function isSafeCELStringContent(value: string): boolean {
  if (typeof value !== "string") return false;
  return !UNSAFE_CEL_STRING_CONTENT.test(value);
}

/**
 * Wrap value in single quotes as a CEL string literal.
 *
 * @throws Error when value is not safe per {@link isSafeCELStringContent}.
 */
export function toCELStringLiteral(value: string): string {
  if (!isSafeCELStringContent(value)) {
    throw new Error(`value cannot be rendered as a CEL string literal: it contains ${UNSAFE_CONTENT_DESCRIPTION}`);
  }
  return `'${value}'`;
}
