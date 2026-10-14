import { describe, it, expect } from "vitest";
import type { CELFilterViolation } from "./celFilter.js";
import { CEL_FILTER_MAX_LENGTH, isSafeCELStringContent, toCELStringLiteral, validateCELFilter } from "./celFilter.js";

describe("validateCELFilter", () => {
  const accepted: Array<[label: string, filter: string]> = [
    ["empty string", ""],
    ["data_type equality", "data_type == 'tekton.dev/v1.PipelineRun'"],
    ["timestamp call", "data.status.startTime > timestamp('2024-01-01T00:00:00.000Z')"],
    ["label index", "data.metadata.labels['app.edp.epam.com/pipelinetype'] == 'build'"],
    ["name and data_type", "data.metadata.name == 'my-run' && data_type == 'tekton.dev/v1.PipelineRun'"],
    ["annotation contains", "annotations['object.metadata.name'].contains('build')"],
    ["status disjunction", "(summary.status == 2 || summary.status == 3)"],
    ["log resource filter", "data_type == 'results.tekton.dev/v1alpha3.Log' && data.spec.resource.name == 'foo'"],
    ["double-quoted delimiters", 'annotations["object.metadata.name"] == "run-1"'],
    ["double-quoted number value", 'annotations["app.edp.epam.com/git-change-number"] == "44"'],
    ["branch value with slash", "data.metadata.labels['x'] == 'feature/ABC-1'"],
    ["email value", "data.author == 'jane.doe@example.com'"],
    ["unicode author", "data.author == 'José Ğ'"],
    ["empty single-quoted value", "x == ''"],
    ["empty double-quoted value", 'x == ""'],
    ["two empty literals compared", "'' == ''"],
    ["empty name and data_type", "data.metadata.name == '' && data_type == 'tekton.dev/v1.PipelineRun'"],
  ];

  it.each(accepted)("accepts %s", (_label, filter) => {
    expect(validateCELFilter(filter)).toEqual({ valid: true });
  });

  const rejected: Array<[filter: string, violation: CELFilterViolation]> = [
    ['name == "a\'b"', "disallowed-string-content"],
    ["name == 'a\"b'", "disallowed-string-content"],
    ["name == 'a\\b'", "disallowed-string-content"],
    ["a \\ b", "disallowed-character"],
    ["x == '''y'''", "triple-quoted-string"],
    ['x == """y"""', "triple-quoted-string"],
    ["r'x'", "prefixed-string"],
    ['R"x"', "prefixed-string"],
    ["b'x'", "prefixed-string"],
    ["name == 'x", "unterminated-string"],
    ["x == 'a\nb'", "disallowed-string-content"],
    ["x // comment", "line-comment"],
    ["x) || (y", "unbalanced-brackets"],
    ["(x", "unbalanced-brackets"],
    ["(x]", "unbalanced-brackets"],
    ["[x)", "unbalanced-brackets"],
    ["x == `y`", "disallowed-character"],
    ["x @ y", "disallowed-character"],
    ["a == b; drop", "disallowed-character"],
    ["x == 'a\\b'", "disallowed-string-content"],
    ["x == 'a\\' || true || \\'b'", "disallowed-string-content"],
    ["x == 'a`b'", "disallowed-string-content"],
    ["x == 'a''b'", "adjacent-string-literal"],
    ['"a""b"', "adjacent-string-literal"],
    ["'a'\"b\"", "adjacent-string-literal"],
    ["rb'x'", "prefixed-string"],
    ['bR"x"', "prefixed-string"],
    ["Br'x'", "prefixed-string"],
    ["x == '\uD800'", "disallowed-string-content"],
    ["x == '\u200D'", "disallowed-string-content"],
    ["x == '\u007F'", "disallowed-string-content"],
  ];

  it.each(rejected)("rejects %j with violation %s", (filter, violation) => {
    const result = validateCELFilter(filter);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.violation).toBe(violation);
    }
  });

  it("reports too-long for a filter over the maximum length", () => {
    const filter = "a".repeat(CEL_FILTER_MAX_LENGTH + 1);
    const result = validateCELFilter(filter);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.violation).toBe("too-long");
      expect(result.position).toBe(0);
    }
  });

  it("includes a human-readable message on the failure result", () => {
    const result = validateCELFilter('name == "a\'b"');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toContain("backslashes");
    }
  });

  it("accepts a filter of exactly the maximum length", () => {
    const filter = "a".repeat(CEL_FILTER_MAX_LENGTH);
    expect(validateCELFilter(filter)).toEqual({ valid: true });
  });
});

describe("isSafeCELStringContent", () => {
  it.each(["my-run", "feature/ABC-1", "jane.doe@example.com", "José Ğ", "object.metadata.name", ""])(
    "accepts %j",
    (value) => {
      expect(isSafeCELStringContent(value)).toBe(true);
    }
  );

  it.each([
    ["single quote", "a'b"],
    ["double quote", 'a"b'],
    ["backslash", "a\\b"],
    ["backtick", "a`b"],
    ["newline", "a\nb"],
    ["tab", "a\tb"],
    ["null byte", "a\u0000b"],
    ["line separator", "a\u2028b"],
  ])("rejects content with a %s", (_label, value) => {
    expect(isSafeCELStringContent(value)).toBe(false);
  });
});

describe("toCELStringLiteral", () => {
  it("wraps a safe value in single quotes", () => {
    expect(toCELStringLiteral("abc")).toBe("'abc'");
  });

  it("wraps an empty value in single quotes", () => {
    expect(toCELStringLiteral("")).toBe("''");
  });

  it.each(["a'b", 'a"b', "a\\b", "a\nb"])("throws for unsafe value %j", (value) => {
    expect(() => toCELStringLiteral(value)).toThrow();
  });

  it("throws for a non-string value", () => {
    expect(() => toCELStringLiteral({ toString: () => "x" } as unknown as string)).toThrow();
    expect(() => toCELStringLiteral(undefined as unknown as string)).toThrow();
  });

  it.each(["my-run", "feature/ABC-1", "jane.doe@example.com", "José Ğ", ""])(
    "round-trips %j into a valid filter",
    (value) => {
      expect(validateCELFilter(`x == ${toCELStringLiteral(value)}`)).toEqual({ valid: true });
    }
  );
});
