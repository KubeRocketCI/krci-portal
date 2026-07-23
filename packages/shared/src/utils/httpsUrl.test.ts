import { describe, it, expect } from "vitest";
import { isHttpsUrl, safeHttpsHref, httpsUrlSchema } from "./httpsUrl.js";

describe("isHttpsUrl", () => {
  it("accepts https URLs", () => {
    expect(isHttpsUrl("https://argocd.example.com")).toBe(true);
    expect(isHttpsUrl("https://host:8443/path?q=1")).toBe(true);
  });

  it("rejects non-https schemes and malformed input", () => {
    expect(isHttpsUrl("http://argocd.example.com")).toBe(false);
    expect(isHttpsUrl("javascript:alert(document.cookie)")).toBe(false);
    expect(isHttpsUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isHttpsUrl("/relative/path")).toBe(false);
    expect(isHttpsUrl("not a url")).toBe(false);
    expect(isHttpsUrl("")).toBe(false);
    expect(isHttpsUrl(undefined)).toBe(false);
    expect(isHttpsUrl(null)).toBe(false);
  });
});

describe("safeHttpsHref", () => {
  it("returns the url when https, otherwise undefined", () => {
    expect(safeHttpsHref("https://ok.example.com")).toBe("https://ok.example.com");
    expect(safeHttpsHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHttpsHref("http://insecure.example.com")).toBeUndefined();
  });
});

describe("httpsUrlSchema", () => {
  it("passes https and fails everything else", () => {
    expect(httpsUrlSchema.safeParse("https://ok.example.com").success).toBe(true);
    expect(httpsUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(httpsUrlSchema.safeParse("http://insecure.example.com").success).toBe(false);
  });
});
