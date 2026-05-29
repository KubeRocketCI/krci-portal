import { describe, expect, it } from "vitest";
import { resolveCRDVersion, storageVersionName, escapeRe } from "./crdUtils";

const crd = (versions: Array<{ name: string; storage?: boolean; served?: boolean }>) =>
  ({
    spec: { versions } as never,
  }) as never;

describe("resolveCRDVersion", () => {
  it("returns preferredVersion when it exists and is served", () => {
    const c = crd([
      { name: "v1alpha1", served: true },
      { name: "v1", storage: true, served: true },
    ]);
    expect(resolveCRDVersion(c, "v1alpha1")?.name).toBe("v1alpha1");
  });

  it("skips preferredVersion when it exists but is not served", () => {
    const c = crd([
      { name: "v1alpha1", served: false },
      { name: "v1", storage: true, served: true },
    ]);
    expect(resolveCRDVersion(c, "v1alpha1")?.name).toBe("v1");
  });

  it("returns the storage version when storage:true and served", () => {
    const c = crd([
      { name: "v1alpha1", served: true },
      { name: "v1", storage: true, served: true },
    ]);
    expect(resolveCRDVersion(c)?.name).toBe("v1");
  });

  it("skips the storage version when storage:true but served:false (migration state)", () => {
    const c = crd([
      { name: "v1alpha1", storage: true, served: false },
      { name: "v1", served: true },
    ]);
    expect(resolveCRDVersion(c)?.name).toBe("v1");
  });

  it("returns the first served version when no storage version is served", () => {
    const c = crd([
      { name: "v1alpha1", served: false },
      { name: "v1beta1", served: true },
    ]);
    expect(resolveCRDVersion(c)?.name).toBe("v1beta1");
  });

  it("falls back to versions[0] when every version is explicitly served:false", () => {
    const c = crd([
      { name: "v1alpha1", served: false },
      { name: "v1beta1", served: false },
    ]);
    expect(resolveCRDVersion(c)?.name).toBe("v1alpha1");
  });

  it("returns undefined for an empty versions array", () => {
    expect(resolveCRDVersion(crd([]))).toBeUndefined();
  });
});

describe("storageVersionName", () => {
  it("returns the storage version when one is marked and served", () => {
    expect(
      storageVersionName(
        crd([
          { name: "v1alpha1", served: true },
          { name: "v1", storage: true, served: true },
          { name: "v1beta1", served: true },
        ])
      )
    ).toBe("v1");
  });

  it("falls back when no version has storage:true", () => {
    expect(storageVersionName(crd([{ name: "v1alpha1", served: true }, { name: "v1beta1" }]))).toBe("v1alpha1");
  });

  it("does NOT return a storage version that is not served (migration state)", () => {
    expect(
      storageVersionName(
        crd([
          { name: "v1alpha1", storage: true, served: false },
          { name: "v1", served: true },
        ])
      )
    ).toBe("v1");
  });
});

describe("escapeRe", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRe("foo.bar/baz")).toBe("foo\\.bar/baz");
    expect(escapeRe("a+b*c?")).toBe("a\\+b\\*c\\?");
  });
});
