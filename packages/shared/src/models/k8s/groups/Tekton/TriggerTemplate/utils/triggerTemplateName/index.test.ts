import { describe, expect, it } from "vitest";
import { triggerTemplateName } from "./index.js";

describe("triggerTemplateName", () => {
  it("builds the per-provider build template name", () => {
    expect(triggerTemplateName("gitlab", "build")).toBe("gitlab-build-template");
  });

  it("builds the per-provider security template name", () => {
    expect(triggerTemplateName("github", "security")).toBe("github-security-template");
  });

  it("returns undefined for an unresolved provider", () => {
    expect(triggerTemplateName(undefined, "build")).toBeUndefined();
  });
});
