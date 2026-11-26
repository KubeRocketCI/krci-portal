import { TRIAGED_RUNTIME_SCAN_LIMIT, type ExposedSecretsInput, type PlatformFindingsList } from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import type { DefectDojoFinding } from "../../../../clients/defectDojo/index.js";
import { createCaller } from "../../../index.js";
import {
  DEMO_IMAGE,
  DEMO_NAMESPACE,
  DEMO_PLATFORM,
  GITLEAKS,
  SEMGREP,
  TRIVY,
  codebaseTags,
  createFakeDefectDojo,
  findingOf,
  givenCluster,
  idOfFindingUrl,
  makeApplication,
  makeImageTest,
  makeRuntimeTest,
  makeStage,
  makeTest,
  makeTriagedFinding,
  type FakeDefectDojo,
  type FakeDefectDojoOptions,
  type RuntimeTestOverrides,
} from "../../__fixtures__/testDoubles.js";

const doubles = vi.hoisted(() => ({ defectDojo: null as FakeDefectDojo | null }));

vi.mock("../../../../clients/defectDojo/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../clients/defectDojo/index.js")>()),
  createDefectDojoClient: () => doubles.defectDojo,
}));

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

const secrets = (id: number, overrides: Omit<RuntimeTestOverrides, "id">) =>
  makeRuntimeTest({ id, reportKind: "exposedsecretreport", ...overrides });

/**
 * Runtime tests: the secrets of demo-app on both Stages, a vulnerability report of the same container, a closed
 * secret test (empty build id), a secret test on a cluster without a Stage.
 */
const RUNTIME_TESTS = [
  secrets(1, { namespace: "demo-dev", application: "demo-dev-demo-app" }),
  makeRuntimeTest({ id: 2, namespace: "demo-dev", application: "demo-dev-demo-app" }),
  secrets(3, { cluster: "remote-cluster", namespace: "demo-prod", application: "demo-prod-demo-app" }),
  secrets(5, { namespace: "demo-dev", application: "demo-dev-demo-app", workload: "deployment.worker", buildId: "" }),
  secrets(6, { cluster: "edge", namespace: "ingress", application: "ingress", workload: "daemonset.proxy" }),
];

/** CI tests of the tenant: Gitleaks of demo-app and of other-app, Semgrep and Trivy of demo-app. */
const CI_TESTS = [
  makeTest({ id: 13, scanType: GITLEAKS }),
  makeTest({ id: 14, scanType: GITLEAKS, tags: codebaseTags("other-app") }),
  makeTest({ id: 12, scanType: SEMGREP }),
  makeImageTest({ id: 10, scanType: TRIVY, image: DEMO_IMAGE, version: "main-1" }),
];

const FINDINGS: Record<number, DefectDojoFinding[]> = {
  1: [findingOf(1101, 1, "High", { title: "Secret Detected in /app/.env - AWS Access Key", filePath: "/app/.env" })],
  2: [findingOf(1201, 2, "Critical", { vulnerabilityIds: ["CVE-2026-0001"] })],
  3: [
    findingOf(1301, 3, "Medium", {
      title: "Secret Detected in /srv/config.yaml - Slack Token",
      filePath: "/srv/config.yaml",
    }),
  ],
  5: [findingOf(1501, 5, "High", { title: "Secret Detected in /etc/worker.env - Generic Key" })],
  6: [findingOf(1601, 6, "Low")],
  13: [
    findingOf(2301, 13, "High", {
      title: "Hard Coded Generic API Key Found in config/app.env",
      filePath: "config/app.env",
      line: 3,
    }),
    makeTriagedFinding({ id: 2302, testId: 13, severity: "High", falsePositive: true }),
    makeTriagedFinding({ id: 2303, testId: 13, severity: "Medium", outOfScope: true }),
    makeTriagedFinding({ id: 2304, testId: 13, severity: "Low", riskAccepted: true, mitigated: false }),
    makeTriagedFinding({ id: 2305, testId: 13, severity: "Low" }),
  ],
  14: [findingOf(2401, 14, "Medium", { filePath: "deploy/values.yaml", line: 21 })],
  12: [findingOf(2201, 12, "Medium", { filePath: "main.go", line: 12 })],
  10: [findingOf(2001, 10, "Critical")],
};

function givenDefectDojo(options: FakeDefectDojoOptions = {}): FakeDefectDojo {
  doubles.defectDojo = createFakeDefectDojo({ tests: [...RUNTIME_TESTS, ...CI_TESTS], findings: FINDINGS, ...options });
  return doubles.defectDojo;
}

describe("defectDojo.getExposedSecrets", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  async function getExposedSecrets(input: Partial<ExposedSecretsInput> = {}): Promise<PlatformFindingsList> {
    return createCaller(mockContext).defectDojo.getExposedSecrets({
      level: "code",
      namespace: DEMO_NAMESPACE,
      ...input,
    } as ExposedSecretsInput);
  }

  async function getData(
    input: Partial<ExposedSecretsInput> = {}
  ): Promise<Extract<PlatformFindingsList, { state: "data" }>> {
    const result = await getExposedSecrets(input);
    if (result.state !== "data") {
      throw new Error(`Expected data, got ${result.state}`);
    }
    return result;
  }

  async function idsOf(input: Partial<ExposedSecretsInput> = {}): Promise<number[]> {
    return (await getData(input)).findings.map((row) => idOfFindingUrl(row.url));
  }

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.stubEnv("DEFECTDOJO_URL", "http://defectdojo.example.test");
    vi.stubEnv("DEFECTDOJO_TOKEN", "service-token");
    givenCluster(DEMO_PLATFORM);
    givenDefectDojo();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    doubles.defectDojo = null;
  });

  describe("the code list", () => {
    it("lists the Gitleaks findings of the tenant's codebases, most severe first, and no other scan", async () => {
      expect(await idsOf()).toEqual([2301, 2401]);
    });

    it("lists one codebase", async () => {
      expect(await idsOf({ codebase: "other-app" })).toEqual([2401]);
    });

    it("lists each triaged state; Mitigated holds the fixed findings, not the false positive or out of scope", async () => {
      expect(await idsOf({ state: "falsePositive" })).toEqual([2302]);
      expect(await idsOf({ state: "outOfScope" })).toEqual([2303]);
      expect(await idsOf({ state: "riskAccepted" })).toEqual([2304]);
      expect(await idsOf({ state: "mitigated" })).toEqual([2305]);
    });

    it("filters by severity", async () => {
      expect(await idsOf({ severity: "Medium" })).toEqual([2401]);
    });

    it("names the codebase and the branch of a row, and its file and line", async () => {
      const row = (await getData()).findings.find((candidate) => idOfFindingUrl(candidate.url) === 2301);

      expect(row).toMatchObject({ filePath: "config/app.env", line: 3 });
      expect(row?.place).toEqual({ level: "code", codebase: "demo-app", branch: "main", image: null, version: "" });
    });
  });

  describe("the runtime list", () => {
    const runtime = (input: Partial<Extract<ExposedSecretsInput, { level: "runtime" }>> = {}) =>
      idsOf({ ...input, level: "runtime" });

    it("lists the exposed secret reports of the Stage clusters, and no vulnerability report", async () => {
      expect(await runtime()).toEqual([1101, 1301]);
    });

    it("leaves a closed test out: an active finding of a test without a build id is not listed", async () => {
      expect(await runtime({ workloadNamespace: "demo-dev" })).toEqual([1101]);
    });

    it("lists every cluster when the installation has no Stage", async () => {
      givenCluster([]);

      expect(await runtime()).toEqual([1101, 1301, 1601]);
    });

    it("lists each triaged state of the open tests", async () => {
      givenDefectDojo({
        findings: {
          1: [makeTriagedFinding({ id: 4101, testId: 1, outOfScope: true })],
          3: [makeTriagedFinding({ id: 4301, testId: 3, falsePositive: true })],
        },
      });

      expect(await runtime({ state: "outOfScope" })).toEqual([4101]);
      expect(await runtime({ state: "falsePositive" })).toEqual([4301]);
    });

    it("lists the clusters and the namespace it is asked for", async () => {
      expect(await runtime({ clusters: ["edge"] })).toEqual([1601]);
      expect(await runtime({ clusters: ["remote-cluster"], workloadNamespace: "demo-prod" })).toEqual([1301]);
    });

    it("leaves a closed test out of a triaged state, with an exact total", async () => {
      givenDefectDojo({
        findings: {
          1: [makeTriagedFinding({ id: 4001, testId: 1, riskAccepted: true, mitigated: false })],
          5: [makeTriagedFinding({ id: 5001, testId: 5, riskAccepted: true, mitigated: false })],
        },
      });

      const result = await getData({ level: "runtime", state: "riskAccepted" });

      expect(result.findings.map((row) => idOfFindingUrl(row.url))).toEqual([4001]);
      expect(result.total).toBe(1);
    });

    it(`reads at most ${TRIAGED_RUNTIME_SCAN_LIMIT} findings of a triaged state and says so`, async () => {
      givenDefectDojo({
        findings: {
          1: Array.from({ length: TRIAGED_RUNTIME_SCAN_LIMIT + 10 }, (_, index) =>
            makeTriagedFinding({ id: 10_000 + index, testId: 1, falsePositive: true })
          ),
        },
      });

      const result = await getData({ level: "runtime", state: "falsePositive" });

      expect(result.truncated).toBe(true);
      expect(result.total).toBe(TRIAGED_RUNTIME_SCAN_LIMIT);
    });

    it("rejects the Mitigated state: every finding of a closed test is mitigated", async () => {
      await expect(
        getExposedSecrets({ level: "runtime", state: "mitigated" } as unknown as Partial<ExposedSecretsInput>)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("names the workload container, the Environment and the codebase of a row, and its file", async () => {
      const row = (await getData({ level: "runtime" })).findings.find(
        (candidate) => idOfFindingUrl(candidate.url) === 1101
      );

      expect(row).toMatchObject({ filePath: "/app/.env", line: null });
      expect(row?.place).toMatchObject({
        level: "runtime",
        cluster: "in-cluster",
        namespace: "demo-dev",
        environment: { cdPipeline: "demo", stage: "dev" },
        codebase: "demo-app",
      });
    });

    it("names the Environment and the codebase of a Stage whose cluster is spelled in upper case: DefectDojo keeps tags in lower case", async () => {
      givenCluster([
        makeStage({ name: "prod", clusterName: "Remote-Cluster", namespace: "demo-prod" }),
        makeApplication({ name: "demo-prod-demo-app", stage: "prod" }),
      ]);

      const row = (await getData({ level: "runtime" })).findings.find(
        (candidate) => idOfFindingUrl(candidate.url) === 1301
      );

      expect(row?.place).toMatchObject({
        cluster: "remote-cluster",
        environment: { cdPipeline: "demo", stage: "prod" },
        codebase: "demo-app",
      });
    });
  });

  it("answers no description and no mitigation, even when DefectDojo sends them: the secret stays on the server", async () => {
    const leaky = (row: DefectDojoFinding) =>
      ({ ...row, description: "**Secret:** not-a-real-secret", mitigation: "Rotate the key." }) as DefectDojoFinding;
    givenDefectDojo({ findings: { ...FINDINGS, 1: FINDINGS[1].map(leaky), 13: FINDINGS[13].map(leaky) } });

    const rows = [...(await getData()).findings, ...(await getData({ level: "runtime" })).findings];

    expect(rows.map((row) => idOfFindingUrl(row.url))).toEqual(expect.arrayContaining([2301, 1101]));
    for (const row of rows) {
      expect(row).not.toHaveProperty("description");
      expect(row).not.toHaveProperty("mitigation");
    }
  });

  it("rejects what a secret finding cannot carry and what the browser may not send", async () => {
    for (const extra of [{ vulnerabilityId: "CVE-2026-0001" }, { component: "openssl" }, { level: "image" }]) {
      await expect(getExposedSecrets(extra as unknown as Partial<ExposedSecretsInput>)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
  });

  describe("the states", () => {
    it("say no scan data when no test is in the scope", async () => {
      await expect(getExposedSecrets({ level: "runtime", clusters: ["nowhere"] })).resolves.toEqual({
        state: "noScanData",
      });
    });

    it("say the list is empty, not missing, when the tests of the scope hold no active finding", async () => {
      givenDefectDojo({ findings: {} });

      expect(await getData()).toMatchObject({ total: 0, findings: [] });
    });

    it.each(["unreachable", "notConfigured"] as const)("say DefectDojo is %s when the client does", async (outage) => {
      givenDefectDojo({ outage });

      await expect(getExposedSecrets()).resolves.toEqual({ state: outage });
    });

    it("says not configured without a DefectDojo URL", async () => {
      vi.stubEnv("DEFECTDOJO_URL", "");

      await expect(getExposedSecrets()).resolves.toEqual({ state: "notConfigured" });
    });
  });
});
