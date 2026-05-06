import { describe, expect, it } from "vitest";
import { tektonInputSchemas } from "./tektonInput.js";

describe("tektonInputSchemas.k8sName", () => {
  it("accepts a single-character RFC 1123 DNS label", () => {
    expect(tektonInputSchemas.k8sName.parse("a")).toBe("a");
    expect(tektonInputSchemas.k8sName.parse("0")).toBe("0");
  });

  it("accepts standard hyphenated names", () => {
    expect(tektonInputSchemas.k8sName.parse("foo-build")).toBe("foo-build");
  });

  it("rejects empty strings", () => {
    expect(() => tektonInputSchemas.k8sName.parse("")).toThrow();
  });

  it("rejects names longer than 253 chars", () => {
    expect(() => tektonInputSchemas.k8sName.parse("a".repeat(254))).toThrow();
  });

  it("rejects uppercase, underscores, and other invalid characters", () => {
    expect(() => tektonInputSchemas.k8sName.parse("Foo")).toThrow();
    expect(() => tektonInputSchemas.k8sName.parse("foo_bar")).toThrow();
    expect(() => tektonInputSchemas.k8sName.parse("-leading-hyphen")).toThrow();
    expect(() => tektonInputSchemas.k8sName.parse("trailing-hyphen-")).toThrow();
  });
});

describe("tektonInputSchemas.namespace", () => {
  it("accepts a single-character namespace", () => {
    expect(tektonInputSchemas.namespace.parse("a")).toBe("a");
  });

  it("rejects empty strings", () => {
    expect(() => tektonInputSchemas.namespace.parse("")).toThrow();
  });

  it("rejects values exceeding 253 chars", () => {
    expect(() => tektonInputSchemas.namespace.parse("a".repeat(254))).toThrow();
  });
});

describe("tektonInputSchemas.celFilter", () => {
  it("accepts undefined", () => {
    expect(tektonInputSchemas.celFilter.parse(undefined)).toBeUndefined();
  });

  it("accepts a typical CEL expression", () => {
    const expr = "data_type == 'results.tekton.dev/v1alpha3.Log' && data.spec.resource.name == 'foo'";
    expect(tektonInputSchemas.celFilter.parse(expr)).toBe(expr);
  });

  it("rejects shell metacharacters that could escape the SQL string context", () => {
    expect(() => tektonInputSchemas.celFilter.parse("foo`bar`")).toThrow();
    expect(() => tektonInputSchemas.celFilter.parse("foo@bar")).toThrow();
    expect(() => tektonInputSchemas.celFilter.parse("foo;DROP TABLE x")).toThrow();
  });
});
