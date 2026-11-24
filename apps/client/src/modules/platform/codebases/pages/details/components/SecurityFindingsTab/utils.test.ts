import { describe, expect, it } from "vitest";
import { NO_FINDING_COUNTS, type CodebaseScanRef, type RuntimeContainerRef } from "@my-project/shared";
import type { SecurityFindingsFocus } from "./types";
import { containerLabel, containerTestUrl, environmentLabel, findingsLayout, isFocusedEnvironment } from "./utils";

const ENVIRONMENT = { cdPipeline: "demo", stage: "dev" };

describe("environmentLabel", () => {
  it("names the Environment by its CDPipeline and its stage", () => {
    expect(environmentLabel(ENVIRONMENT)).toBe("demo / dev");
  });
});

describe("isFocusedEnvironment", () => {
  it("is true for the Environment the focus names", () => {
    expect(isFocusedEnvironment(ENVIRONMENT, { cdPipeline: "demo", stage: "dev" })).toBe(true);
  });

  it.each<[string, SecurityFindingsFocus | null]>([
    ["no focus", null],
    ["another stage of the CDPipeline", { cdPipeline: "demo", stage: "qa" }],
    ["the stage of another CDPipeline", { cdPipeline: "other", stage: "dev" }],
    ["the CDPipeline and the stage the wrong way round", { cdPipeline: "dev", stage: "demo" }],
    ["a name that differs in case", { cdPipeline: "Demo", stage: "dev" }],
  ])("is false for %s", (_, focus) => {
    expect(isFocusedEnvironment(ENVIRONMENT, focus)).toBe(false);
  });
});

describe("findingsLayout", () => {
  const code: CodebaseScanRef = { level: "code", branch: "main", scanner: "Semgrep JSON Report", image: null };
  const image: CodebaseScanRef = { level: "image", branch: "main", scanner: "Trivy Scan", image: "registry/app" };
  const runtime: RuntimeContainerRef = {
    level: "runtime",
    cdPipeline: "demo",
    stage: "dev",
    workload: "deployment.app",
    container: "app",
    reportKind: "vulnerabilityreport",
  };

  it.each([
    ["a code scan", code, "code"],
    ["an image scan", image, "image"],
    ["the vulnerabilities of a container", runtime, "image"],
    ["the exposed secrets of a container", { ...runtime, reportKind: "exposedsecretreport" } as const, "code"],
  ])("gives %s the %s layout: a place in the source, or a component and a fix", (_, ref, layout) => {
    expect(findingsLayout(ref)).toBe(layout);
  });
});

describe("containerLabel", () => {
  it("names a container by itself and its Environment", () => {
    expect(containerLabel(ENVIRONMENT, { container: "istio-proxy" })).toBe("istio-proxy in demo / dev");
  });
});

describe("containerTestUrl", () => {
  const vulnerabilities = { counts: NO_FINDING_COUNTS, triaged: 0, testUrl: "https://defectdojo.example.test/test/1" };
  const secrets = { active: 0, triaged: 0, testUrl: "https://defectdojo.example.test/test/2" };

  it("is the test of the vulnerabilities, even when the container has secrets too", () => {
    expect(containerTestUrl({ vulnerabilities, secrets })).toBe("https://defectdojo.example.test/test/1");
    expect(containerTestUrl({ vulnerabilities, secrets: null })).toBe("https://defectdojo.example.test/test/1");
  });

  it("is the test of the secrets when there is no vulnerability report", () => {
    expect(containerTestUrl({ vulnerabilities: null, secrets })).toBe("https://defectdojo.example.test/test/2");
  });

  it("is undefined when the container has no report", () => {
    expect(containerTestUrl({ vulnerabilities: null, secrets: null })).toBeUndefined();
  });
});
