import { describe, expect, it } from "vitest";
import { TAG_KEY, formatTag, tagValue } from "./tags.js";

describe("tagValue", () => {
  it("is the value of the tag of that key", () => {
    expect(tagValue(["k8s-cluster:in-cluster", "k8s-namespace:demo-dev"], "k8s-namespace")).toBe("demo-dev");
  });

  it("is null when no tag has that key", () => {
    expect(tagValue(["k8s-cluster:in-cluster"], "k8s-namespace")).toBeNull();
  });

  it("keeps a colon of the value", () => {
    expect(tagValue(["oci-image:registry.example.test:5000/demo-app"], TAG_KEY.ociImage)).toBe(
      "registry.example.test:5000/demo-app"
    );
  });

  it("does not take a longer key for the key: app is not app.edp.epam.com/codebase", () => {
    expect(tagValue(["app.edp.epam.com/codebase:demo-app"], TAG_KEY.app)).toBeNull();
  });
});

describe("formatTag", () => {
  it("writes a tag as DefectDojo holds it: key, colon, value", () => {
    expect(formatTag(TAG_KEY.workload, "deployment.demo-app")).toBe("k8s-workload:deployment.demo-app");
  });

  it("is read back by tagValue", () => {
    expect(tagValue([formatTag(TAG_KEY.reportKind, "vulnerabilityreport")], TAG_KEY.reportKind)).toBe(
      "vulnerabilityreport"
    );
  });
});
