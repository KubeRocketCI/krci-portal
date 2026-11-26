import {
  K8sApiError,
  k8sApplicationConfig,
  k8sCodebaseBranchConfig,
  k8sCodebaseImageStreamConfig,
  k8sStageConfig,
  type CodebaseFindings,
  type CodebaseLevel,
  type CodebaseScan,
  type DefectDojoSeverity,
  type RuntimeLevel,
} from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import { COUNT_CONCURRENCY } from "../../codebaseFindings/compose.js";
import type { CodebaseFindingsSource } from "../../codebaseFindings/source.js";
import {
  DEMO_CODEBASE,
  DEMO_IMAGE,
  DEMO_CLUSTER,
  DEMO_NAMESPACE,
  DEPLOYED_CLUSTER,
  GITLEAKS,
  GRYPE,
  SEMGREP,
  TRIVY,
  codebaseTags,
  createFakeDefectDojo,
  givenCluster,
  makeApplication,
  makeBranch,
  makeCodebase,
  makeFinding,
  makeImageTest,
  makeImageStream,
  makeRuntimeTest,
  makeStage,
  makeTest,
  makeTriagedFinding,
  type FakeDefectDojoOptions,
} from "../../__fixtures__/testDoubles.js";

const doubles = vi.hoisted(() => ({ defectDojo: null as CodebaseFindingsSource | null }));

vi.mock("../../../../clients/defectDojo/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../clients/defectDojo/index.js")>()),
  createDefectDojoClient: () => doubles.defectDojo,
}));

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

const CHART_IMAGE = "docker.io/library/nginx";

function givenDefectDojo(options: FakeDefectDojoOptions = {}): CodebaseFindingsSource {
  doubles.defectDojo = createFakeDefectDojo(options);
  return doubles.defectDojo;
}

/** `count` active findings of one severity, ids from `firstId`. */
function active(testId: number, severity: DefectDojoSeverity, count: number, firstId = 1) {
  return Array.from({ length: count }, (_, index) =>
    makeFinding({ id: testId * 1000 + firstId + index, testId, severity })
  );
}

describe("defectDojo.getCodebaseFindings", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  const input = { namespace: DEMO_NAMESPACE, name: DEMO_CODEBASE };

  async function getFindings(): Promise<CodebaseFindings> {
    return createCaller(mockContext).defectDojo.getCodebaseFindings(input);
  }

  async function getLevels(): Promise<{ code: CodebaseLevel; image: CodebaseLevel; runtime: RuntimeLevel }> {
    const result = await getFindings();
    if (result.state !== "data") {
      throw new Error(`Expected data, got ${result.state}`);
    }
    return result.levels;
  }

  const scannersOf = (level: CodebaseLevel): string[] => level.scans.map((scan) => scan.ref.scanner);

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

  describe("the states of the tab", () => {
    it.each([
      ["URL", "DEFECTDOJO_URL"],
      ["token", "DEFECTDOJO_TOKEN"],
    ])("says DefectDojo is not configured without the %s, and reads nothing from the cluster", async (_, variable) => {
      vi.stubEnv(variable, "");
      // The mocked context built a client of its own.
      vi.mocked(K8sClient).mockClear();

      await expect(getFindings()).resolves.toEqual({ state: "notConfigured" });
      expect(K8sClient).not.toHaveBeenCalled();
    });

    it("says DefectDojo is not configured when the client says so", async () => {
      givenDefectDojo({ outage: "notConfigured" });

      await expect(getFindings()).resolves.toEqual({ state: "notConfigured" });
    });

    it("says DefectDojo is unreachable when it cannot list the tests", async () => {
      givenDefectDojo({ outage: "unreachable", tests: [makeTest({ id: 1, scanType: SEMGREP })] });

      await expect(getFindings()).resolves.toEqual({ state: "unreachable" });
    });

    it("says DefectDojo is unreachable, with no scan of the levels, when it fails on the counts of one scan", async () => {
      givenDefectDojo({
        outage: "unreachable",
        outageOn: ["getSeverityCounts"],
        tests: [makeTest({ id: 1, scanType: SEMGREP }), makeTest({ id: 2, scanType: GITLEAKS })],
      });

      await expect(getFindings()).resolves.toEqual({ state: "unreachable" });
    });

    it("stops counting the other scans once DefectDojo is unreachable", async () => {
      const scans = Array.from({ length: 20 }, (_, index) => makeTest({ id: index + 1, scanType: SEMGREP }));
      const defectDojo = givenDefectDojo({ outage: "unreachable", outageOn: ["getSeverityCounts"], tests: scans });
      const counts = vi.spyOn(defectDojo, "getSeverityCounts");

      await expect(getFindings()).resolves.toEqual({ state: "unreachable" });
      expect(counts.mock.calls.length).toBeLessThan(scans.length);
    });

    it("says there is no scan data at every level for a codebase without a test", async () => {
      await expect(getLevels()).resolves.toEqual({
        code: { state: "noScanData", scans: [], lastUpload: null },
        image: { state: "noScanData", scans: [], lastUpload: null },
        runtime: { state: "noScanData", environments: [], lastUpload: null },
      });
    });
  });

  describe("each level on its own", () => {
    const codeTest = makeTest({ id: 1, scanType: SEMGREP });
    const imageTest = makeImageTest({ id: 2, scanType: TRIVY, image: DEMO_IMAGE });
    const withFinding = { 1: active(1, "High", 1), 2: active(2, "High", 1) };

    it.each([
      ["code data only", [codeTest], withFinding, "data", "noScanData"],
      ["image data only", [imageTest], withFinding, "noScanData", "data"],
      ["both levels", [codeTest, imageTest], withFinding, "data", "data"],
      ["both levels clean", [codeTest, imageTest], {}, "clean", "clean"],
      ["code clean, image data", [codeTest, imageTest], { 2: active(2, "High", 1) }, "clean", "data"],
    ] as const)("%s", async (_, tests, findings, codeState, imageState) => {
      givenDefectDojo({ tests, findings });

      const levels = await getLevels();

      expect([levels.code.state, levels.image.state]).toEqual([codeState, imageState]);
    });
  });

  describe("a clean scan against no scan", () => {
    it("shows a scan without an active finding as a row with zero counts and the date of its last upload", async () => {
      givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: SEMGREP, updated: "2026-11-21T08:00:00Z" }),
          makeTest({ id: 2, scanType: GITLEAKS, updated: "2026-11-23T08:30:00Z" }),
        ],
      });

      const { code } = await getLevels();

      expect(code.state).toBe("clean");
      expect(code.lastUpload).toBe("2026-11-23T08:30:00Z");
      expect(code.scans.map((scan) => [scan.ref.scanner, scan.date, scan.counts])).toEqual([
        [SEMGREP, "2026-11-21T08:00:00Z", { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 }],
        [GITLEAKS, "2026-11-23T08:30:00Z", { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 }],
      ]);
    });

    it("shows a scan whose findings were all triaged as clean, and counts the triaged ones apart", async () => {
      givenDefectDojo({
        tests: [makeTest({ id: 1, scanType: SEMGREP })],
        findings: { 1: [makeTriagedFinding({ id: 11, testId: 1 }), makeTriagedFinding({ id: 12, testId: 1 })] },
      });

      const { code } = await getLevels();

      expect(code.state).toBe("clean");
      expect(code.scans[0].triaged).toBe(2);
    });

    it("shows no row for a level that no scan reported", async () => {
      givenDefectDojo({ tests: [makeTest({ id: 1, scanType: SEMGREP })] });

      const { image } = await getLevels();

      expect(image).toEqual({ state: "noScanData", scans: [], lastUpload: null });
    });
  });

  describe("the counts of a scan", () => {
    it("are the active findings by severity, with the triaged findings counted apart", async () => {
      givenDefectDojo({
        tests: [makeTest({ id: 1, scanType: SEMGREP })],
        findings: {
          1: [
            ...active(1, "High", 2),
            ...active(1, "Medium", 1, 10),
            ...active(1, "Info", 1, 20),
            makeTriagedFinding({ id: 31, testId: 1, severity: "Critical" }),
            makeFinding({ id: 32, testId: 1, severity: "High", active: false, falsePositive: true }),
            makeFinding({ id: 33, testId: 1, severity: "High", duplicate: true }),
          ],
        },
      });

      const { code } = await getLevels();

      expect(code.state).toBe("data");
      expect(code.scans[0].counts).toEqual({ Critical: 0, High: 2, Medium: 1, Low: 0, Info: 1 });
      expect(code.scans[0].triaged).toBe(2);
    });

    it("are shown per scan: Trivy Scan and Anchore Grype of one image are never added", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE }),
          makeImageTest({ id: 4, scanType: GRYPE, image: DEMO_IMAGE }),
        ],
        findings: {
          3: [...active(3, "Critical", 2), ...active(3, "High", 5, 10)],
          4: [...active(4, "Critical", 1), ...active(4, "High", 8, 10), ...active(4, "Low", 3, 30)],
        },
      });

      const { image } = await getLevels();

      expect(image.scans).toHaveLength(2);
      expect(image.scans.map((scan) => [scan.ref.scanner, scan.ref.image, scan.counts])).toEqual([
        [TRIVY, DEMO_IMAGE, { Critical: 2, High: 5, Medium: 0, Low: 0, Info: 0 }],
        [GRYPE, DEMO_IMAGE, { Critical: 1, High: 8, Medium: 0, Low: 3, Info: 0 }],
      ]);
    });
  });

  describe("the branches", () => {
    it("shows only the branches that have a CodebaseBranch", async () => {
      givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: SEMGREP, branchTag: "main" }),
          makeTest({ id: 2, scanType: SEMGREP, branchTag: "feature-login" }),
          makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE, branchTag: "feature-login" }),
        ],
      });

      const levels = await getLevels();

      expect(levels.code.scans.map((scan) => scan.ref.branch)).toEqual(["main"]);
      expect(levels.image.state).toBe("noScanData");
    });

    it("shows no scan of a test that carries no branch", async () => {
      givenDefectDojo({ tests: [makeImageTest({ id: 3, scanType: TRIVY, image: CHART_IMAGE, branchTag: "" })] });

      const { image } = await getLevels();

      expect(image.state).toBe("noScanData");
    });

    it("lists the default branch first, then the others by name", async () => {
      givenCluster([
        makeCodebase(DEMO_CODEBASE, "main"),
        makeBranch("release-1.0"),
        makeBranch("feature-login"),
        makeBranch("main"),
      ]);
      givenDefectDojo({
        tests: ["release-1.0", "feature-login", "main"].map((branchTag, index) =>
          makeTest({ id: index + 1, scanType: SEMGREP, branchTag })
        ),
      });

      const { code } = await getLevels();

      expect(code.scans.map((scan) => scan.ref.branch)).toEqual(["main", "feature-login", "release-1.0"]);
    });

    it("shows the other branches when the default branch has no CodebaseBranch", async () => {
      givenCluster([makeCodebase(DEMO_CODEBASE, "main"), makeBranch("release-1.0"), makeBranch("feature-login")]);
      givenDefectDojo({
        tests: ["main", "release-1.0", "feature-login"].map((branchTag, index) =>
          makeTest({ id: index + 1, scanType: SEMGREP, branchTag })
        ),
      });

      const { code } = await getLevels();

      expect(code.scans.map((scan) => scan.ref.branch)).toEqual(["feature-login", "release-1.0"]);
    });

    it("matches a branch and a default branch spelled in upper case as written: the branch of a test is no tag", async () => {
      givenCluster([makeCodebase(DEMO_CODEBASE, "Main"), makeBranch("Release-1.0"), makeBranch("Main")]);
      givenDefectDojo({
        tests: ["Release-1.0", "Main"].map((branchTag, index) =>
          makeTest({ id: index + 1, scanType: SEMGREP, branchTag })
        ),
      });

      const { code } = await getLevels();

      expect(code.scans.map((scan) => scan.ref.branch)).toEqual(["Main", "Release-1.0"]);
    });

    it("takes the branches of this codebase only", async () => {
      givenCluster([...DEMO_CLUSTER, makeCodebase("other-app"), makeBranch("feature-other", "other-app")]);
      givenDefectDojo({ tests: [makeTest({ id: 1, scanType: SEMGREP, branchTag: "feature-other" })] });

      const { code } = await getLevels();

      expect(code.state).toBe("noScanData");
    });
  });

  describe("tests of one scan", () => {
    it("show one row for the newest of the tests that share a branch, scanner and image", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 1, scanType: TRIVY, image: DEMO_IMAGE, updated: "2026-11-21T10:00:00Z", version: "old" }),
          makeImageTest({ id: 2, scanType: TRIVY, image: DEMO_IMAGE, updated: "2026-11-23T10:00:00Z", version: "new" }),
          makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE, updated: "2026-11-22T10:00:00Z", version: "mid" }),
        ],
        findings: { 1: active(1, "Critical", 3), 2: active(2, "High", 1) },
      });

      const { image } = await getLevels();

      expect(image.scans).toHaveLength(1);
      expect(image.scans[0]).toMatchObject({ version: "new", counts: { Critical: 0, High: 1 } });
    });

    it("keep the scans of another scanner or image apart", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 1, scanType: TRIVY, image: DEMO_IMAGE }),
          makeImageTest({ id: 2, scanType: GRYPE, image: DEMO_IMAGE }),
          makeImageTest({ id: 3, scanType: TRIVY, image: CHART_IMAGE }),
        ],
      });

      const { image } = await getLevels();

      expect(image.scans).toHaveLength(3);
    });
  });

  describe("the images", () => {
    it("tells the own image of the codebase from a third-party image of its chart, and lists the own image first", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 1, scanType: TRIVY, image: CHART_IMAGE }),
          makeImageTest({ id: 2, scanType: TRIVY, image: DEMO_IMAGE }),
        ],
      });

      const { image } = await getLevels();

      expect(image.scans.map((scan) => [scan.ref.image, scan.ownImage])).toEqual([
        [DEMO_IMAGE, true],
        [CHART_IMAGE, false],
      ]);
    });

    it("takes an image for the own one whatever the case of the name of its image stream: DefectDojo lower-cases tags", async () => {
      givenCluster([makeCodebase(), makeBranch("main"), makeImageStream("Registry.Example.Test/Krci/Demo-App")]);
      givenDefectDojo({ tests: [makeImageTest({ id: 1, scanType: TRIVY, image: DEMO_IMAGE })] });

      const { image } = await getLevels();

      expect(image.scans[0]).toMatchObject({ ref: { image: DEMO_IMAGE }, ownImage: true });
    });

    it("takes an image for an own one only by the image stream of this codebase", async () => {
      givenCluster([...DEMO_CLUSTER, makeImageStream(CHART_IMAGE, "other-app", "other-app-main")]);
      givenDefectDojo({ tests: [makeImageTest({ id: 1, scanType: TRIVY, image: CHART_IMAGE })] });

      const { image } = await getLevels();

      expect(image.scans[0].ownImage).toBe(false);
    });

    it("keeps the image tag that was scanned, and none for the scan of a code level", async () => {
      givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: SEMGREP }),
          makeImageTest({ id: 2, scanType: TRIVY, image: DEMO_IMAGE, version: "main-20261123-090000" }),
        ],
      });

      const levels = await getLevels();

      expect(levels.image.scans[0].version).toBe("main-20261123-090000");
      expect(levels.code.scans[0]).toMatchObject({ version: "", ref: { image: null }, ownImage: false });
    });

    it("orders the scanners of one image as the level lists them, whatever order DefectDojo answers in", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 1, scanType: GRYPE, image: DEMO_IMAGE }),
          makeImageTest({ id: 2, scanType: TRIVY, image: DEMO_IMAGE }),
        ],
      });

      const { image } = await getLevels();

      expect(scannersOf(image)).toEqual([TRIVY, GRYPE]);
    });
  });

  describe("the tests of the codebase", () => {
    it("are the tests that carry its codebase tag and the tenant tag of its namespace", async () => {
      givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: SEMGREP }),
          makeTest({ id: 2, scanType: GITLEAKS, tags: codebaseTags("other-app") }),
          makeTest({ id: 3, scanType: GITLEAKS, tags: codebaseTags(DEMO_CODEBASE, "other-tenant") }),
          makeTest({ id: 4, scanType: GITLEAKS, tags: [] }),
        ],
      });

      const { code } = await getLevels();

      expect(scannersOf(code)).toEqual([SEMGREP]);
    });

    it("leave out a runtime test and a scan of no level", async () => {
      givenDefectDojo({
        tests: [
          makeTest({ id: 1, scanType: "Trivy Operator Scan" }),
          makeTest({ id: 2, scanType: "Bandit Scan" }),
          makeTest({ id: 3, scanType: SEMGREP }),
        ],
      });

      const levels = await getLevels();

      expect(scannersOf(levels.code)).toEqual([SEMGREP]);
      expect(levels.image.state).toBe("noScanData");
    });

    it("link to the test and the product of the scan in DefectDojo", async () => {
      givenDefectDojo({ tests: [makeTest({ id: 1, scanType: SEMGREP })] });

      const { code } = await getLevels();
      const scan: CodebaseScan = code.scans[0];

      expect(scan.testUrl).toBe("https://defectdojo.example.test/test/1");
      expect(scan.productUrl).toBe("https://defectdojo.example.test/asset/7");
    });
  });

  describe("the access", () => {
    it("rejects a caller with no session with UNAUTHORIZED", async () => {
      mockContext.session.user = undefined;

      await expect(getFindings()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("rejects a caller who cannot read the codebase with FORBIDDEN, before it asks DefectDojo", async () => {
      const defectDojo = givenDefectDojo({ tests: [makeTest({ id: 1, scanType: SEMGREP })] });
      const listTests = vi.spyOn(defectDojo, "listTests");
      (K8sClient as unknown as Mock).mockImplementation(function () {
        return {
          KubeConfig: {},
          async getResource() {
            throw new K8sApiError(403, "Forbidden", "codebases is forbidden");
          },
          async listResource() {
            return { items: [] };
          },
        };
      });

      await expect(getFindings()).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(listTests).not.toHaveBeenCalled();
    });

    it.each([
      ["branches", k8sCodebaseBranchConfig],
      ["image streams", k8sCodebaseImageStreamConfig],
    ])("rejects a caller who may not list the %s of the codebase with FORBIDDEN", async (_, forbidden) => {
      givenCluster(DEPLOYED_CLUSTER, { forbidden: [forbidden] });

      await expect(getFindings()).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("answers NOT_FOUND for a codebase that does not exist", async () => {
      givenCluster([]);

      await expect(getFindings()).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects a namespace that is not a Kubernetes name", async () => {
      await expect(
        createCaller(mockContext).defectDojo.getCodebaseFindings({ namespace: "krci/../x", name: DEMO_CODEBASE })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("the Runtime level", () => {
    const DEV_TAGS = ["k8s-cluster:in-cluster", "k8s-namespace:demo-dev", "app:demo-dev-demo-app"];
    const PRODUCT_URL = "https://defectdojo.example.test/asset/7";

    const QA_OBJECTS = [
      makeApplication({ name: "demo-qa-demo-app", stage: "qa" }),
      makeStage({ name: "qa", namespace: "demo-qa", order: 1 }),
    ];

    const containersOf = (runtime: RuntimeLevel, stage = "dev") =>
      runtime.environments.find((environment) => environment.stage === stage)?.containers;

    const countsOf = (counts: MockInstance<CodebaseFindingsSource["getSeverityCounts"]>, testId: number) =>
      counts.mock.calls.flatMap(([scope, options]) => ("testId" in scope && scope.testId === testId ? [options] : []));

    beforeEach(() => {
      givenCluster(DEPLOYED_CLUSTER);
    });

    describe("an Environment with scan data", () => {
      it("shows a running container with its version, counts, secrets and links; the severity cells hold the vulnerabilities only", async () => {
        givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10, version: "main-20261124", updated: "2026-11-24T08:00:00Z" }),
            makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport", updated: "2026-11-24T09:00:00Z" }),
          ],
          findings: {
            10: [
              ...active(10, "High", 3),
              ...active(10, "Low", 1, 10),
              makeTriagedFinding({ id: 10900, testId: 10, severity: "Critical" }),
            ],
            11: [...active(11, "High", 2), makeTriagedFinding({ id: 11900, testId: 11, severity: "High" })],
          },
        });

        const { runtime } = await getLevels();

        expect(runtime).toEqual({
          state: "data",
          lastUpload: "2026-11-24T09:00:00Z",
          environments: [
            {
              cdPipeline: "demo",
              stage: "dev",
              clusterName: "in-cluster",
              namespace: "demo-dev",
              containers: [
                {
                  state: "running",
                  workload: "deployment.demo-app",
                  container: "demo-app",
                  image: DEMO_IMAGE,
                  ownImage: true,
                  productUrl: PRODUCT_URL,
                  version: "main-20261124",
                  date: "2026-11-24T09:00:00Z",
                  vulnerabilities: {
                    counts: { Critical: 0, High: 3, Medium: 0, Low: 1, Info: 0 },
                    triaged: 1,
                    testUrl: "https://defectdojo.example.test/test/10",
                  },
                  secrets: { active: 2, triaged: 1, testUrl: "https://defectdojo.example.test/test/11" },
                },
              ],
            },
          ],
        });
      });

      it("says clean for running containers without an active vulnerability or secret", async () => {
        givenDefectDojo({
          tests: [makeRuntimeTest({ id: 10 }), makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport" })],
          findings: { 10: [makeTriagedFinding({ id: 10900, testId: 10 })] },
        });

        const { runtime } = await getLevels();

        expect(runtime.state).toBe("clean");
        expect(containersOf(runtime)).toMatchObject([
          { vulnerabilities: { triaged: 1 }, secrets: { active: 0, triaged: 0 } },
        ]);
      });

      it("says data when only a secret is active", async () => {
        givenDefectDojo({
          tests: [makeRuntimeTest({ id: 10 }), makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport" })],
          findings: { 11: active(11, "High", 1) },
        });

        await expect(getLevels()).resolves.toMatchObject({ runtime: { state: "data" } });
      });

      it("shows a container with no VulnerabilityReport test without counts, and no ExposedSecretReport test as none", async () => {
        givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10, reportKind: "exposedsecretreport" }),
            makeRuntimeTest({ id: 11, container: "other" }),
          ],
        });

        const { runtime } = await getLevels();

        expect(containersOf(runtime)).toMatchObject([
          { container: "demo-app", vulnerabilities: null, secrets: { active: 0 } },
          { container: "other", vulnerabilities: { counts: { High: 0 } }, secrets: null },
        ]);
      });
    });

    describe("an Environment with no scan data", () => {
      it("is listed with no container, and the level says there is no scan data", async () => {
        await expect(getLevels()).resolves.toMatchObject({
          runtime: {
            state: "noScanData",
            lastUpload: null,
            environments: [{ cdPipeline: "demo", stage: "dev", containers: [] }],
          },
        });
      });

      it("stays listed beside an Environment with data, and the level says data", async () => {
        givenCluster([...DEPLOYED_CLUSTER, ...QA_OBJECTS]);
        givenDefectDojo({ tests: [makeRuntimeTest({ id: 10 })], findings: { 10: active(10, "High", 1) } });

        const { runtime } = await getLevels();

        expect(runtime.state).toBe("data");
        expect(runtime.environments.map((environment) => [environment.stage, environment.containers.length])).toEqual([
          ["dev", 1],
          ["qa", 0],
        ]);
      });
    });

    describe("a closed test", () => {
      it("makes a row that is not running, with no counts, and the level says not running", async () => {
        const defectDojo = givenDefectDojo({
          tests: [makeRuntimeTest({ id: 10, buildId: "" })],
          findings: { 10: active(10, "High", 4) },
        });
        const counts = vi.spyOn(defectDojo, "getSeverityCounts");

        const { runtime } = await getLevels();

        expect(runtime.state).toBe("notRunning");
        expect(runtime.lastUpload).toBeNull();
        expect(containersOf(runtime)).toStrictEqual([
          {
            state: "notRunning",
            workload: "deployment.demo-app",
            container: "demo-app",
            image: DEMO_IMAGE,
            ownImage: true,
            productUrl: PRODUCT_URL,
          },
        ]);
        expect(counts).not.toHaveBeenCalled();
      });

      it("leaves the level to its running sibling, and is never counted", async () => {
        const defectDojo = givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10, buildId: "", updated: "2026-11-25T08:00:00Z" }),
            makeRuntimeTest({ id: 11, container: "istio-proxy", updated: "2026-11-24T08:00:00Z" }),
          ],
          findings: { 10: active(10, "Critical", 5) },
        });
        const counts = vi.spyOn(defectDojo, "getSeverityCounts");

        const { runtime } = await getLevels();

        expect(runtime.state).toBe("clean");
        expect(runtime.lastUpload).toBe("2026-11-24T08:00:00Z");
        expect(containersOf(runtime)?.map(({ container, state }) => [container, state])).toEqual([
          ["istio-proxy", "running"],
          ["demo-app", "notRunning"],
        ]);
        expect(countsOf(counts, 10)).toEqual([]);
        expect(countsOf(counts, 11)).toHaveLength(1);
      });
    });

    describe("an ExposedSecretReport test", () => {
      it("counts as secrets whatever its title says: the kind comes from the report-kind tag", async () => {
        givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10 }),
            makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport", title: "VulnerabilityReport demo-app" }),
          ],
          findings: { 10: active(10, "High", 3), 11: active(11, "High", 2) },
        });

        const { runtime } = await getLevels();

        expect(containersOf(runtime)).toMatchObject([
          { vulnerabilities: { counts: { High: 3 } }, secrets: { active: 2 } },
        ]);
      });
    });

    describe("the Environments", () => {
      it("are the Applications of the codebase that name a Stage, and no more", async () => {
        givenCluster([
          ...DEPLOYED_CLUSTER,
          makeApplication({ name: "other-dev-other-app", codebase: "other-app", pipeline: "other" }),
          makeStage({ cdPipeline: "other", name: "dev", namespace: "other-dev" }),
          makeApplication({ name: "demo-unlabelled-demo-app", pipeline: null }),
          makeApplication({ name: "demo-gone-demo-app", stage: "gone" }),
          makeStage({ name: "prod", namespace: "demo-prod", order: 2 }),
        ]);
        const defectDojo = givenDefectDojo({ tests: [makeRuntimeTest({ id: 10 })] });
        const listTests = vi.spyOn(defectDojo, "listTests");

        const { runtime } = await getLevels();

        expect(runtime.environments.map(({ cdPipeline, stage }) => `${cdPipeline}/${stage}`)).toEqual(["demo/dev"]);
        expect(listTests).toHaveBeenCalledTimes(2);
        expect(listTests).toHaveBeenCalledWith({ tags: DEV_TAGS });
      });

      it("are ordered by CDPipeline, then by the order of the Stage", async () => {
        givenCluster([
          ...DEMO_CLUSTER,
          makeApplication({ name: "zeta-dev-demo-app", pipeline: "zeta", stage: "dev" }),
          makeStage({ cdPipeline: "zeta", name: "dev", namespace: "zeta-dev", order: 0 }),
          makeApplication({ name: "alpha-prod-demo-app", pipeline: "alpha", stage: "prod" }),
          makeStage({ cdPipeline: "alpha", name: "prod", namespace: "alpha-prod", order: 1 }),
          makeApplication({ name: "alpha-qa-demo-app", pipeline: "alpha", stage: "qa" }),
          makeStage({ cdPipeline: "alpha", name: "qa", namespace: "alpha-qa", order: 0 }),
        ]);

        const { runtime } = await getLevels();

        expect(runtime.environments.map(({ cdPipeline, stage }) => `${cdPipeline}/${stage}`)).toEqual([
          "alpha/qa",
          "alpha/prod",
          "zeta/dev",
        ]);
      });

      it("include a Stage on a remote cluster, found by the tags of that cluster, with only the portal cluster read", async () => {
        givenCluster([
          ...DEMO_CLUSTER,
          makeApplication({ name: "demo-prod-demo-app", stage: "prod" }),
          makeStage({ name: "prod", namespace: "demo-prod", clusterName: "remote" }),
        ]);
        const defectDojo = givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10, cluster: "remote", namespace: "demo-prod", application: "demo-prod-demo-app" }),
          ],
        });
        const listTests = vi.spyOn(defectDojo, "listTests");
        vi.mocked(K8sClient).mockClear();

        const { runtime } = await getLevels();

        expect(listTests).toHaveBeenCalledWith({
          tags: ["k8s-cluster:remote", "k8s-namespace:demo-prod", "app:demo-prod-demo-app"],
        });
        expect(runtime.environments).toMatchObject([
          { stage: "prod", clusterName: "remote", namespace: "demo-prod", containers: [{ state: "running" }] },
        ]);
        expect(K8sClient).toHaveBeenCalledTimes(1);
      });

      it("include a Stage whose cluster is spelled in upper case, found by the lower case tags of DefectDojo, with the cluster as the Stage spells it", async () => {
        givenCluster([
          ...DEMO_CLUSTER,
          makeApplication({ name: "demo-prod-demo-app", stage: "prod" }),
          makeStage({ name: "prod", namespace: "demo-prod", clusterName: "Remote" }),
        ]);
        givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10, cluster: "remote", namespace: "demo-prod", application: "demo-prod-demo-app" }),
          ],
        });

        const { runtime } = await getLevels();

        expect(runtime.environments).toMatchObject([
          { stage: "prod", clusterName: "Remote", containers: [{ state: "running" }] },
        ]);
      });

      it.each([
        ["the cluster does not serve the Applications", { notServed: [k8sApplicationConfig] }],
        ["the cluster does not serve the Stages", { notServed: [k8sStageConfig] }],
        ["the user may not list the Applications", { forbidden: [k8sApplicationConfig] }],
        ["the user may not list the Stages", { forbidden: [k8sStageConfig] }],
      ])("are none, with Code and Image answering, when %s", async (_, options) => {
        givenCluster(DEPLOYED_CLUSTER, options);
        givenDefectDojo({
          tests: [makeTest({ id: 1, scanType: SEMGREP }), makeImageTest({ id: 2, scanType: TRIVY, image: DEMO_IMAGE })],
          findings: { 1: active(1, "High", 1), 2: active(2, "High", 1) },
        });

        const levels = await getLevels();

        expect(levels.runtime).toEqual({ state: "noScanData", environments: [], lastUpload: null });
        expect([levels.code.state, levels.image.state]).toEqual(["data", "data"]);
      });
    });

    describe("the rows", () => {
      it("are one per workload and container with both report kinds in it, a sidecar a second row, own image first", async () => {
        givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10, container: "istio-proxy", image: "docker.io/istio/proxyv2" }),
            makeRuntimeTest({ id: 11 }),
            makeRuntimeTest({ id: 12, reportKind: "exposedsecretreport" }),
            makeRuntimeTest({ id: 13, reportKind: null, container: "no-kind" }),
            makeRuntimeTest({ id: 14, workload: null, container: "no-workload" }),
            makeRuntimeTest({ id: 15, container: null }),
          ],
        });

        const { runtime } = await getLevels();

        expect(
          containersOf(runtime)?.map(({ workload, container, ownImage }) => [workload, container, ownImage])
        ).toEqual([
          ["deployment.demo-app", "demo-app", true],
          ["deployment.demo-app", "istio-proxy", false],
        ]);
        expect(containersOf(runtime)?.[0]).toMatchObject({
          vulnerabilities: { testUrl: "https://defectdojo.example.test/test/11" },
          secrets: { testUrl: "https://defectdojo.example.test/test/12" },
        });
      });

      it("come from the open test of a container and report kind, the newest of several, never from a closed one", async () => {
        givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10, buildId: "", updated: "2026-11-20T08:00:00Z" }),
            makeRuntimeTest({ id: 11, updated: "2026-11-22T08:00:00Z" }),
            makeRuntimeTest({ id: 12, container: "sidecar", updated: "2026-11-21T08:00:00Z" }),
            makeRuntimeTest({ id: 13, container: "sidecar", updated: "2026-11-23T08:00:00Z" }),
          ],
          findings: {
            10: active(10, "Critical", 1),
            11: active(11, "High", 2),
            12: active(12, "Low", 1),
            13: active(13, "Medium", 3),
          },
        });

        const { runtime } = await getLevels();

        expect(containersOf(runtime)).toMatchObject([
          { container: "demo-app", vulnerabilities: { counts: { Critical: 0, High: 2 } } },
          { container: "sidecar", vulnerabilities: { counts: { Low: 0, Medium: 3 } } },
        ]);
      });
    });

    describe("the requests to DefectDojo", () => {
      it("ask for the tests of an Environment by exactly its cluster, namespace and Application", async () => {
        const defectDojo = givenDefectDojo();
        const listTests = vi.spyOn(defectDojo, "listTests");

        await getFindings();

        expect(listTests).toHaveBeenCalledWith({ tags: DEV_TAGS });
      });

      it("count a secrets test once, a clean vulnerabilities test once, an active one twice, and a closed one never", async () => {
        const defectDojo = givenDefectDojo({
          tests: [
            makeRuntimeTest({ id: 10 }),
            makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport" }),
            makeRuntimeTest({ id: 12, container: "sidecar" }),
            makeRuntimeTest({ id: 13, container: "stopped", buildId: "" }),
          ],
          findings: { 11: active(11, "High", 2), 12: active(12, "High", 1) },
        });
        const counts = vi.spyOn(defectDojo, "getSeverityCounts");

        await getFindings();

        expect(countsOf(counts, 10)).toEqual([{ state: "any", testExists: true }]);
        expect(countsOf(counts, 11)).toEqual([{ state: "any", testExists: true }]);
        expect(countsOf(counts, 12)).toEqual([
          { state: "any", testExists: true },
          { state: "active", testExists: true },
        ]);
        expect(countsOf(counts, 13)).toEqual([]);
      });

      it("count the CI scans and the runtime tests together, never more at a time than the bound", async () => {
        // Four CI scans and COUNT_CONCURRENCY - 2 containers: neither fills the bound alone, together they exceed it.
        const defectDojo = givenDefectDojo({
          tests: [
            makeTest({ id: 1, scanType: SEMGREP }),
            makeTest({ id: 2, scanType: GITLEAKS }),
            makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE }),
            makeImageTest({ id: 4, scanType: GRYPE, image: DEMO_IMAGE }),
            ...Array.from({ length: COUNT_CONCURRENCY - 2 }, (_, index) =>
              makeRuntimeTest({ id: 5 + index, container: `container-${index}` })
            ),
          ],
        });
        const count = defectDojo.getSeverityCounts;
        let inFlight = 0;
        let peak = 0;
        vi.spyOn(defectDojo, "getSeverityCounts").mockImplementation(async (...args) => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          await new Promise((resolve) => setTimeout(resolve, 5));
          inFlight -= 1;
          return count(...args);
        });

        await getFindings();

        expect(peak).toBe(COUNT_CONCURRENCY);
      });
    });

    describe("the states", () => {
      it.each(["unreachable", "notConfigured"] as const)(
        "make the whole result %s when DefectDojo fails on the tests of an Environment",
        async (state) => {
          const defectDojo = givenDefectDojo({
            tests: [makeTest({ id: 1, scanType: SEMGREP }), makeRuntimeTest({ id: 10 })],
          });
          const listTests = defectDojo.listTests;
          vi.spyOn(defectDojo, "listTests").mockImplementation(async (filter) =>
            filter.tags.includes("k8s-cluster:in-cluster") ? { state } : listTests(filter)
          );

          await expect(getFindings()).resolves.toEqual({ state });
        }
      );

      it("make the whole result unreachable when DefectDojo fails on the count of a runtime test", async () => {
        givenDefectDojo({
          outage: "unreachable",
          outageOn: ["getSeverityCounts"],
          tests: [makeRuntimeTest({ id: 10 })],
        });

        await expect(getFindings()).resolves.toEqual({ state: "unreachable" });
      });

      it("rethrow an error that is no DefectDojo state", async () => {
        const defectDojo = givenDefectDojo({ tests: [makeRuntimeTest({ id: 10 })] });
        vi.spyOn(defectDojo, "getSeverityCounts").mockRejectedValue(new Error("boom"));

        await expect(getFindings()).rejects.toThrow("boom");
      });
    });

    describe("a test that is gone when it is counted", () => {
      function givenCountGone(defectDojo: CodebaseFindingsSource, testId: number, state?: "active") {
        const count = defectDojo.getSeverityCounts;
        vi.spyOn(defectDojo, "getSeverityCounts").mockImplementation(async (scope, options) =>
          "testId" in scope && scope.testId === testId && (state === undefined || options?.state === state)
            ? { state: "noScanData" }
            : count(scope, options)
        );
      }

      it.each([
        ["every count", undefined],
        ["the count of the active findings", "active" as const],
      ])("leaves its CI scan out, when DefectDojo has no scan data for %s", async (_, state) => {
        const defectDojo = givenDefectDojo({
          tests: [makeTest({ id: 1, scanType: SEMGREP }), makeTest({ id: 2, scanType: GITLEAKS })],
          findings: { 1: active(1, "High", 1), 2: active(2, "High", 1) },
        });
        givenCountGone(defectDojo, 1, state);

        const { code } = await getLevels();

        expect(scannersOf(code)).toEqual([GITLEAKS]);
      });

      it.each([
        ["every count", undefined],
        ["the count of the active findings", "active" as const],
      ])("leaves its report out of its container, when DefectDojo has no scan data for %s", async (_, state) => {
        const defectDojo = givenDefectDojo({
          tests: [makeRuntimeTest({ id: 10 }), makeRuntimeTest({ id: 11, reportKind: "exposedsecretreport" })],
          findings: { 10: active(10, "High", 1), 11: active(11, "High", 1) },
        });
        givenCountGone(defectDojo, 10, state);

        const { runtime } = await getLevels();

        expect(containersOf(runtime)).toMatchObject([{ vulnerabilities: null, secrets: { active: 1 } }]);
      });
    });
  });
});
