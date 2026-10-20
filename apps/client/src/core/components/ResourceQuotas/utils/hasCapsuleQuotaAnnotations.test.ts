import { describe, expect, it } from "vitest";
import { ResourceQuota } from "@my-project/shared";
import { hasCapsuleQuotaAnnotations } from "./hasCapsuleQuotaAnnotations";

const withAnnotations = (annotations?: Record<string, string>) =>
  ({ metadata: { name: "rq", annotations } }) as unknown as ResourceQuota;

describe("hasCapsuleQuotaAnnotations", () => {
  it("matches keys under the Capsule quota prefix", () => {
    expect(hasCapsuleQuotaAnnotations(withAnnotations({ "quota.capsule.clastix.io/hard-pods": "10" }))).toBe(true);
  });

  it("does not match the host as a substring elsewhere in the key", () => {
    expect(hasCapsuleQuotaAnnotations(withAnnotations({ "evil.com/quota.capsule.clastix.io": "1" }))).toBe(false);
    expect(hasCapsuleQuotaAnnotations(withAnnotations({ "quota.capsule.clastix.io.evil.com/x": "1" }))).toBe(false);
  });

  it("returns false without annotations or item", () => {
    expect(hasCapsuleQuotaAnnotations(withAnnotations())).toBe(false);
    expect(hasCapsuleQuotaAnnotations(undefined)).toBe(false);
  });
});
