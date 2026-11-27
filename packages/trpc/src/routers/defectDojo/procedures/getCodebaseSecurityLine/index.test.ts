import { k8sApplicationConfig, k8sStageConfig, type CodebaseSecurityLine } from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import type { CodebaseFindingsSource } from "../../codebaseFindings/source.js";
import {
  DEMO_CLUSTER,
  DEMO_CODEBASE,
  DEMO_IMAGE,
  DEMO_NAMESPACE,
  DEPLOYED_CLUSTER,
  GITLEAKS,
  GRYPE,
  SEMGREP,
  TRIVY,
  activeFindings,
  createFakeDefectDojo,
  givenCluster,
  givenCodebaseForbidden,
  makeApplication,
  makeBranch,
  makeCodebase,
  makeImageStream,
  makeImageTest,
  makeRuntimeTest,
  makeStage,
  makeTest,
  type FakeDefectDojoOptions,
} from "../../__fixtures__/testDoubles.js";

const doubles = vi.hoisted(() => ({ defectDojo: null as CodebaseFindingsSource | null }));

vi.mock("../../../../clients/defectDojo/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../clients/defectDojo/index.js")>()),
  createDefectDojoClient: () => doubles.defectDojo,
}));

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

function givenDefectDojo(options: FakeDefectDojoOptions = {}): CodebaseFindingsSource {
  doubles.defectDojo = createFakeDefectDojo(options);
  return doubles.defectDojo;
}

describe("defectDojo.getCodebaseSecurityLine", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  const input = { namespace: DEMO_NAMESPACE, name: DEMO_CODEBASE };

  function getLine(): Promise<CodebaseSecurityLine> {
    return createCaller(mockContext).defectDojo.getCodebaseSecurityLine(input);
  }

  async function getLevels() {
    const line = await getLine();
    if (line.state !== "data") {
      throw new Error(`Expected data, got ${line.state}`);
    }
    return line.levels;
  }

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.stubEnv("DEFECTDOJO_URL", "http://defectdojo.example.test");
    vi.stubEnv("DEFECTDOJO_TOKEN", "service-token");
    givenCluster();
    givenDefectDojo();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    doubles.defectDojo = null;
  });

  describe("the states of the line", () => {
    it.each([
      ["URL", "DEFECTDOJO_URL"],
      ["token", "DEFECTDOJO_TOKEN"],
    ])("says DefectDojo is not configured without the %s, and reads nothing from the cluster", async (_, variable) => {
      vi.stubEnv(variable, "");
      // The mocked context built a client of its own.
      vi.mocked(K8sClient).mockClear();

      await expect(getLine()).resolves.toEqual({ state: "notConfigured" });
      expect(K8sClient).not.toHaveBeenCalled();
    });

    it("says DefectDojo is not configured when the client says so", async () => {
      givenDefectDojo({ outage: "notConfigured" });

      await expect(getLine()).resolves.toEqual({ state: "notConfigured" });
    });

    it("says DefectDojo is unreachable when it cannot list the tests", async () => {
      givenDefectDojo({ outage: "unreachable", tests: [makeTest({ id: 1, scanType: SEMGREP })] });

      await expect(getLine()).resolves.toEqual({ state: "unreachable" });
    });

    it("says DefectDojo is unreachable, with no level, when it fails on the counts of one scan", async () => {
      givenDefectDojo({
        outage: "unreachable",
        outageOn: ["getSeverityCounts"],
        tests: [makeTest({ id: 1, scanType: SEMGREP }), makeTest({ id: 2, scanType: GITLEAKS })],
      });

      await expect(getLine()).resolves.toEqual({ state: "unreachable" });
    });

    it("rejects a caller who cannot read the codebase with FORBIDDEN, before it asks DefectDojo, as the tab", async () => {
      const defectDojo = givenDefectDojo({ tests: [makeTest({ id: 1, scanType: SEMGREP })] });
      const listTests = vi.spyOn(defectDojo, "listTests");
      givenCodebaseForbidden();

      await expect(getLine()).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(listTests).not.toHaveBeenCalled();
    });

    it("leaves out a scan the client has no data for: no scan data, not clean", async () => {
      const defectDojo = givenDefectDojo({ tests: [makeTest({ id: 1, scanType: SEMGREP })] });
      vi.spyOn(defectDojo, "getSeverityCounts").mockResolvedValue({ state: "noScanData" });

      await expect(getLevels()).resolves.toMatchObject({ code: { state: "noScanData" } });
    });
  });

  describe("the requests to DefectDojo", () => {
    it("are the CI tests, the tests of each Environment and one count of the active findings per candidate", async () => {
      givenCluster(DEPLOYED_CLUSTER);
      const defectDojo = givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: SEMGREP }),
          makeTest({ id: 2, scanType: GITLEAKS }),
          makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE }),
          makeRuntimeTest({ id: 10 }),
          makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport" }),
          makeRuntimeTest({ id: 12, container: "worker", buildId: "" }),
        ],
        findings: { 1: activeFindings(1, "High", 1), 10: activeFindings(10, "Critical", 1) },
      });
      const listTests = vi.spyOn(defectDojo, "listTests");
      const counts = vi.spyOn(defectDojo, "getSeverityCounts");

      await getLine();

      expect(listTests).toHaveBeenCalledTimes(2);
      const countedTests = counts.mock.calls.map(([scope]) => ("testId" in scope ? scope.testId : null));
      expect(countedTests.sort((a, b) => Number(a) - Number(b))).toEqual([1, 2, 3, 10, 11]);
      expect(new Set(counts.mock.calls.map(([, options]) => JSON.stringify(options)))).toEqual(
        new Set([JSON.stringify({ state: "active", testExists: true })])
      );
    });

    it("skip the CI tests when the default branch has no CodebaseBranch", async () => {
      givenCluster([makeCodebase(), makeBranch("feature-login"), makeImageStream(DEMO_IMAGE)]);
      const listTests = vi.spyOn(givenDefectDojo(), "listTests");

      await getLine();

      expect(listTests).not.toHaveBeenCalled();
    });
  });

  it("names the counts the tab shows for the same scan of the default branch", async () => {
    givenDefectDojo({
      tests: [makeTest({ id: 1, scanType: SEMGREP }), makeImageTest({ id: 3, scanType: GRYPE, image: DEMO_IMAGE })],
      findings: {
        1: activeFindings(1, "High", 2),
        3: [...activeFindings(3, "Critical", 1), ...activeFindings(3, "Low", 4, 10)],
      },
    });

    const levels = await getLevels();
    const tab = await createCaller(mockContext).defectDojo.getCodebaseFindings(input);
    if (tab.state !== "data") {
      throw new Error(`Expected data, got ${tab.state}`);
    }

    const [semgrep] = tab.levels.code.scans;
    const [grype] = tab.levels.image.scans;
    expect(levels.code).toEqual({ state: "data", severity: "High", count: semgrep.counts.High, scanner: SEMGREP });
    expect(levels.image).toEqual({ state: "data", severity: "Critical", count: grype.counts.Critical, scanner: GRYPE });
  });

  describe("the Code level", () => {
    it("names the scan of the default branch with the most severe finding: one Medium before twenty Low", async () => {
      givenDefectDojo({
        tests: [makeTest({ id: 1, scanType: SEMGREP }), makeTest({ id: 2, scanType: GITLEAKS })],
        findings: { 1: activeFindings(1, "Low", 20), 2: activeFindings(2, "Medium", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({
        code: { state: "data", severity: "Medium", count: 1, scanner: GITLEAKS },
      });
    });

    it("is clean when the scans of the default branch hold no active finding, whatever another branch holds", async () => {
      givenCluster([...DEMO_CLUSTER, makeBranch("feature-login")]);
      givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: SEMGREP }),
          makeTest({ id: 2, scanType: SEMGREP, branchTag: "feature-login" }),
        ],
        findings: { 2: activeFindings(2, "Critical", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({ code: { state: "clean" } });
    });

    it("has no scan data without a scan of the default branch", async () => {
      givenCluster([...DEMO_CLUSTER, makeBranch("feature-login")]);
      givenDefectDojo({ tests: [makeTest({ id: 2, scanType: SEMGREP, branchTag: "feature-login" })] });

      await expect(getLevels()).resolves.toMatchObject({ code: { state: "noScanData" } });
    });

    it("reads the newest test of a scan only: an older test of the same scanner and branch is no candidate", async () => {
      givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: SEMGREP, updated: "2026-11-20T10:00:00Z" }),
          makeTest({ id: 2, scanType: SEMGREP, updated: "2026-11-23T10:00:00Z" }),
        ],
        findings: { 1: activeFindings(1, "Critical", 3) },
      });

      await expect(getLevels()).resolves.toMatchObject({ code: { state: "clean" } });
    });
  });

  describe("the Image level", () => {
    it("names one of two scanners of one image, never their sum", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 1, scanType: TRIVY, image: DEMO_IMAGE }),
          makeImageTest({ id: 2, scanType: GRYPE, image: DEMO_IMAGE }),
        ],
        findings: {
          1: [...activeFindings(1, "Critical", 1), ...activeFindings(1, "High", 2, 10)],
          2: [...activeFindings(2, "Critical", 1), ...activeFindings(2, "High", 1, 10)],
        },
      });

      await expect(getLevels()).resolves.toMatchObject({
        image: { state: "data", severity: "Critical", count: 1, scanner: TRIVY },
      });
    });

    it("is clean when the image scans of the default branch hold no active finding", async () => {
      givenDefectDojo({
        tests: [makeImageTest({ id: 1, scanType: TRIVY, image: DEMO_IMAGE }), makeTest({ id: 2, scanType: SEMGREP })],
        findings: { 2: activeFindings(2, "High", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({ image: { state: "clean" }, code: { state: "data" } });
    });

    it("has no scan data without an image scan of the default branch, whatever the Code level holds", async () => {
      givenDefectDojo({
        tests: [makeTest({ id: 2, scanType: SEMGREP })],
        findings: { 2: activeFindings(2, "High", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({ image: { state: "noScanData" }, code: { state: "data" } });
    });
  });

  describe("the Runtime level", () => {
    beforeEach(() => givenCluster(DEPLOYED_CLUSTER));

    it("names the report with the most severe finding, its kind and its Environment: an exposed secret here", async () => {
      givenDefectDojo({
        tests: [makeRuntimeTest({ id: 10 }), makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport" })],
        findings: { 10: activeFindings(10, "High", 2), 11: activeFindings(11, "Critical", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({
        runtime: {
          state: "data",
          severity: "Critical",
          count: 1,
          reportKind: "exposedsecretreport",
          environment: { cdPipeline: "demo", stage: "dev" },
        },
      });
    });

    it("between equal counts names the vulnerabilities before the exposed secrets, the first Environment first", async () => {
      givenCluster([
        ...DEPLOYED_CLUSTER,
        makeApplication({ name: "demo-prod-demo-app", stage: "prod" }),
        makeStage({ name: "prod", namespace: "demo-prod" }),
      ]);
      givenDefectDojo({
        tests: [
          makeRuntimeTest({ id: 10, namespace: "demo-prod", application: "demo-prod-demo-app" }),
          makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport" }),
          makeRuntimeTest({ id: 12 }),
        ],
        findings: {
          10: activeFindings(10, "High", 1),
          11: activeFindings(11, "High", 1),
          12: activeFindings(12, "High", 1),
        },
      });

      await expect(getLevels()).resolves.toMatchObject({
        runtime: { reportKind: "vulnerabilityreport", environment: { stage: "dev" } },
      });
    });

    it("is not running when every container of every Environment is closed", async () => {
      givenDefectDojo({
        tests: [
          makeRuntimeTest({ id: 10, buildId: "" }),
          makeRuntimeTest({ id: 11, container: "worker", buildId: "" }),
        ],
        findings: { 10: activeFindings(10, "Critical", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({ runtime: { state: "notRunning" } });
    });

    it("counts no closed report: open vulnerabilities and a closed exposed secrets test of one container", async () => {
      givenDefectDojo({
        tests: [
          makeRuntimeTest({ id: 10 }),
          makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport", buildId: "" }),
        ],
        findings: { 10: activeFindings(10, "Medium", 1), 11: activeFindings(11, "Critical", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({
        runtime: { state: "data", severity: "Medium", reportKind: "vulnerabilityreport" },
      });
    });

    it("is clean when its running containers hold no active finding, though a closed one does", async () => {
      givenDefectDojo({
        tests: [makeRuntimeTest({ id: 10 }), makeRuntimeTest({ id: 11, container: "worker", buildId: "" })],
        findings: { 11: activeFindings(11, "Critical", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({ runtime: { state: "clean" } });
    });

    it("has no scan data for a codebase that no Application deploys", async () => {
      givenCluster(DEMO_CLUSTER);
      givenDefectDojo({ tests: [makeRuntimeTest({ id: 10 })], findings: { 10: activeFindings(10, "Critical", 1) } });

      await expect(getLevels()).resolves.toMatchObject({ runtime: { state: "noScanData" } });
    });

    it.each([
      ["Applications", k8sApplicationConfig],
      ["Stages", k8sStageConfig],
    ])("has no scan data for a user who may not list the %s: no Environment is known", async (_, config) => {
      givenCluster(DEPLOYED_CLUSTER, { forbidden: [config] });
      givenDefectDojo({ tests: [makeRuntimeTest({ id: 10 })], findings: { 10: activeFindings(10, "Critical", 1) } });

      await expect(getLevels()).resolves.toMatchObject({ runtime: { state: "noScanData" } });
    });
  });

  describe("the default branch", () => {
    it("is compared as written: a test of develop is no scan of the default branch Develop", async () => {
      givenCluster([
        makeCodebase(DEMO_CODEBASE, "Develop"),
        makeBranch("Develop"),
        makeBranch("develop"),
        makeImageStream(DEMO_IMAGE),
      ]);
      givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: SEMGREP, branchTag: "Develop" }),
          makeTest({ id: 2, scanType: GITLEAKS, branchTag: "develop" }),
        ],
        findings: { 1: activeFindings(1, "Low", 1), 2: activeFindings(2, "Critical", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({
        code: { state: "data", severity: "Low", count: 1, scanner: SEMGREP },
      });
    });

    it("has no scan when no CodebaseBranch has it, as on the tab", async () => {
      givenCluster([makeCodebase(), makeBranch("feature-login"), makeImageStream(DEMO_IMAGE)]);
      givenDefectDojo({
        tests: [makeTest({ id: 1, scanType: SEMGREP })],
        findings: { 1: activeFindings(1, "Critical", 1) },
      });

      await expect(getLevels()).resolves.toMatchObject({
        code: { state: "noScanData" },
        image: { state: "noScanData" },
      });
    });
  });
});
