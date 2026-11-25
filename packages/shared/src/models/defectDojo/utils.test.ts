import { describe, expect, it } from "vitest";
import { CODEBASE_SCAN_LEVELS, DEFECTDOJO_SEVERITIES, NO_FINDING_COUNTS } from "./constants.js";
import { runtimeContainerRefSchema } from "./schemas.js";
import type { CodebaseScanRef } from "./types.js";
import {
  hasActiveFindings,
  hasActiveRuntimeFindings,
  hasFindingFilter,
  isRuntimeFindingState,
  runtimeContainerKey,
  runtimeContainerRef,
  scanRefKey,
} from "./utils.js";

const TRIVY: CodebaseScanRef = {
  level: "image",
  branch: "main",
  scanner: "Trivy Scan",
  image: "registry.example.test/app",
};

const ENVIRONMENT = { cdPipeline: "demo", stage: "dev", clusterName: "in-cluster", namespace: "demo-dev" };

const CONTAINER = { workload: "deployment.demo-app", container: "demo-app", image: "registry.example.test/app" };

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

describe("runtimeContainerRef", () => {
  it("names the Environment, the container and the report of a summary row, and nothing else of it", () => {
    expect(runtimeContainerRef(ENVIRONMENT, CONTAINER, "exposedsecretreport")).toEqual({
      level: "runtime",
      cdPipeline: "demo",
      stage: "dev",
      workload: "deployment.demo-app",
      container: "demo-app",
      reportKind: "exposedsecretreport",
    });
  });

  it("is a ref the server accepts", () => {
    expect(
      runtimeContainerRefSchema.safeParse(runtimeContainerRef(ENVIRONMENT, CONTAINER, "vulnerabilityreport")).success
    ).toBe(true);
  });
});

describe("runtimeContainerKey", () => {
  it("is the same for the same container of the same Environment, whatever else its row carries", () => {
    const movedEnvironment = { ...ENVIRONMENT, namespace: "moved" };
    const containerWithoutImage = { ...CONTAINER, image: null };

    expect(runtimeContainerKey(ENVIRONMENT, CONTAINER)).toBe(
      runtimeContainerKey(movedEnvironment, containerWithoutImage)
    );
  });

  it.each([
    ["CDPipeline", { cdPipeline: "other" }, {}],
    ["stage", { stage: "qa" }, {}],
    ["workload", {}, { workload: "statefulset.demo-app" }],
    ["container", {}, { container: "istio-proxy" }],
  ])("differs for another %s", (_, environment, container) => {
    expect(runtimeContainerKey({ ...ENVIRONMENT, ...environment }, { ...CONTAINER, ...container })).not.toBe(
      runtimeContainerKey(ENVIRONMENT, CONTAINER)
    );
  });

  it("starts with runtime, which is no level of a scan: a container row and a scan never share an expansion", () => {
    expect(JSON.parse(runtimeContainerKey(ENVIRONMENT, CONTAINER))[0]).toBe("runtime");
    expect(CODEBASE_SCAN_LEVELS).not.toContain("runtime");
  });
});

describe("hasActiveFindings", () => {
  it("is false for counts that are all zero", () => {
    expect(hasActiveFindings(NO_FINDING_COUNTS)).toBe(false);
  });

  it.each(DEFECTDOJO_SEVERITIES)("is true when only %s is above zero", (severity) => {
    expect(hasActiveFindings({ ...NO_FINDING_COUNTS, [severity]: 1 })).toBe(true);
  });
});

describe("hasActiveRuntimeFindings", () => {
  const vulnerabilities = (counts = NO_FINDING_COUNTS) => ({
    counts,
    triaged: 0,
    testUrl: "https://defectdojo.example.test/test/1",
  });
  const secrets = (active: number) => ({ active, triaged: 0, testUrl: "https://defectdojo.example.test/test/2" });

  it.each([
    ["no report", { vulnerabilities: null, secrets: null }],
    [
      "a vulnerability report and no secret report, both without a finding",
      { vulnerabilities: vulnerabilities(), secrets: null },
    ],
    ["no vulnerability report and no active secret", { vulnerabilities: null, secrets: secrets(0) }],
    ["both reports, neither with an active finding", { vulnerabilities: vulnerabilities(), secrets: secrets(0) }],
  ])("is false for %s", (_, container) => {
    expect(hasActiveRuntimeFindings(container)).toBe(false);
  });

  it.each([
    [
      "an active vulnerability",
      { vulnerabilities: vulnerabilities({ ...NO_FINDING_COUNTS, Low: 1 }), secrets: secrets(0) },
    ],
    ["an active secret", { vulnerabilities: vulnerabilities(), secrets: secrets(2) }],
    ["an active secret and no vulnerability report", { vulnerabilities: null, secrets: secrets(1) }],
    [
      "an active vulnerability and no secret report",
      { vulnerabilities: vulnerabilities({ ...NO_FINDING_COUNTS, High: 3 }), secrets: null },
    ],
  ])("is true for %s", (_, container) => {
    expect(hasActiveRuntimeFindings(container)).toBe(true);
  });
});

describe("isRuntimeFindingState", () => {
  it("is true for every state but Mitigated", () => {
    expect(isRuntimeFindingState("active")).toBe(true);
    expect(isRuntimeFindingState("riskAccepted")).toBe(true);
    expect(isRuntimeFindingState("mitigated")).toBe(false);
  });
});

describe("hasFindingFilter", () => {
  const SCOPE_ONLY = {
    state: "active",
    severity: undefined,
    vulnerabilityId: undefined,
    component: undefined,
  } as const;

  it("is false for a list with no filter but its scope: an empty page then means no findings", () => {
    expect(hasFindingFilter(SCOPE_ONLY)).toBe(false);
  });

  it.each([
    ["a state other than active", { state: "falsePositive" }],
    ["a severity", { severity: "Critical" }],
    ["a vulnerability id", { vulnerabilityId: "CVE-2026-0001" }],
    ["a component", { component: "openssl" }],
  ] as const)("is true for %s: an empty page then means no match", (_, filter) => {
    expect(hasFindingFilter({ ...SCOPE_ONLY, ...filter })).toBe(true);
  });

  it("reads a secret list, which has no vulnerability id and no component, the same way", () => {
    expect(hasFindingFilter({ state: "active" })).toBe(false);
    expect(hasFindingFilter({ state: "riskAccepted" })).toBe(true);
    expect(hasFindingFilter({ state: "active", severity: "High" })).toBe(true);
  });
});
