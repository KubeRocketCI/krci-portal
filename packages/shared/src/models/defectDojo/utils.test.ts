import { describe, expect, it } from "vitest";
import type { CodebaseScanRef } from "./types.js";
import { scanRefKey } from "./utils.js";

const TRIVY: CodebaseScanRef = {
  level: "image",
  branch: "main",
  scanner: "Trivy Scan",
  image: "registry.example.test/app",
};

describe("scanRefKey", () => {
  it("is the same for the same scan", () => {
    expect(scanRefKey({ ...TRIVY })).toBe(scanRefKey(TRIVY));
  });

  it.each([
    ["scanner", { scanner: "Anchore Grype" }],
    ["branch", { branch: "release-1.0" }],
    ["image", { image: "docker.io/library/nginx" }],
    ["level", { level: "code", image: null } as const],
  ])("differs for another %s", (_, change) => {
    expect(scanRefKey({ ...TRIVY, ...change })).not.toBe(scanRefKey(TRIVY));
  });

  it("does not mix a code scan with an image scan whose image is named like no image", () => {
    const code: CodebaseScanRef = { level: "code", branch: "main", scanner: "Semgrep JSON Report", image: null };
    const image: CodebaseScanRef = { level: "image", branch: "main", scanner: "Semgrep JSON Report", image: "null" };

    expect(scanRefKey(code)).not.toBe(scanRefKey(image));
  });
});
