import {
  K8sApiError,
  type CodebaseFindings,
  type CodebaseLevel,
  type CodebaseScan,
  type DefectDojoSeverity,
} from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import type { CodebaseFindingsSource } from "../../codebaseFindings/source.js";
import {
  DEMO_CODEBASE,
  DEMO_IMAGE,
  DEMO_CLUSTER,
  DEMO_NAMESPACE,
  GITLEAKS,
  GRYPE,
  SEMGREP,
  TRIVY,
  codebaseTags,
  createFakeDefectDojo,
  givenCluster,
  makeBranch,
  makeCodebase,
  makeFinding,
  makeImageTest,
  makeImageStream,
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

  async function getLevels(): Promise<{ code: CodebaseLevel; image: CodebaseLevel }> {
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

    it("says there is no scan data at both levels for a codebase without a test", async () => {
      await expect(getLevels()).resolves.toEqual({
        code: { state: "noScanData", scans: [], lastUpload: null },
        image: { state: "noScanData", scans: [], lastUpload: null },
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
});
