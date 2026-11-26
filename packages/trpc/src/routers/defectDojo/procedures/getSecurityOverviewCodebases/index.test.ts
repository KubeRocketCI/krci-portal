import {
  k8sCodebaseBranchConfig,
  k8sCodebaseConfig,
  k8sCodebaseImageStreamConfig,
  scanTypeLines,
  type SecurityOverviewCodebases,
  type SecurityOverviewCodebasesInput,
} from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import type { KubeObject } from "../../__fixtures__/kubeReader.js";
import {
  DEMO_CODEBASE,
  DEMO_IMAGE,
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
  makeImageStream,
  makeFindingsOf,
  makeImageTest,
  makeTest,
  makeTriagedFinding,
  type FakeDefectDojo,
  type FakeDefectDojoOptions,
} from "../../__fixtures__/testDoubles.js";
import { clearSecurityOverviewCache } from "../../securityOverview/cache.js";

const doubles = vi.hoisted(() => ({ defectDojo: null as FakeDefectDojo | null }));

vi.mock("../../../../clients/defectDojo/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../clients/defectDojo/index.js")>()),
  createDefectDojoClient: () => doubles.defectDojo,
}));

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

const THIRD_PARTY_IMAGE = "docker.io/library/nginx";

const TESTS = [
  makeTest({ id: 1, scanType: SEMGREP, updated: "2026-11-22T10:00:00Z" }),
  makeTest({ id: 2, scanType: SEMGREP }),
  makeTest({ id: 3, scanType: GITLEAKS }),
  makeImageTest({ id: 4, scanType: TRIVY, image: THIRD_PARTY_IMAGE }),
  makeImageTest({ id: 5, scanType: GRYPE, image: DEMO_IMAGE }),
  makeImageTest({ id: 6, scanType: TRIVY, image: DEMO_IMAGE }),
];

const FINDINGS = {
  1: makeFindingsOf(TESTS[0], ["Critical", "Critical", "Critical"]),
  2: makeFindingsOf(TESTS[1], ["Critical", "High"]),
  4: makeFindingsOf(TESTS[3], ["Low"]),
  5: makeFindingsOf(TESTS[4], ["High", "High"]),
  6: makeFindingsOf(TESTS[5], ["High", "High", "High"]),
};

/** A scan of a branch whose CodebaseBranch is gone, and one of a branch that has one, and of the default branch. */
const OLD_BRANCH_TEST = makeTest({ id: 7, scanType: SEMGREP, branchTag: "old" });
const FEATURE_TEST = makeTest({ id: 8, scanType: SEMGREP, branchTag: "feature/x" });

/** Scans of a codebase tag that no Codebase has: the Codebase was deleted, its product stays. */
const GONE_TESTS = ["main", "develop"].map((branchTag, index) =>
  makeTest({
    id: 20 + index,
    scanType: SEMGREP,
    branchTag,
    tags: codebaseTags("gone-app"),
    product: { id: 8, name: "gone-app", url: "https://defectdojo.example.test/asset/8" },
  })
);

const CLUSTER: KubeObject[] = [
  makeCodebase(),
  makeBranch("main"),
  makeBranch("feature/x"),
  makeImageStream(DEMO_IMAGE),
];

function givenDefectDojo(options: FakeDefectDojoOptions = {}): FakeDefectDojo {
  doubles.defectDojo = createFakeDefectDojo({ tests: TESTS, findings: FINDINGS, ...options });
  return doubles.defectDojo;
}

describe("defectDojo.getSecurityOverviewCodebases", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  async function getCodebases(input: Partial<SecurityOverviewCodebasesInput> = {}): Promise<SecurityOverviewCodebases> {
    return createCaller(mockContext).defectDojo.getSecurityOverviewCodebases({ namespace: DEMO_NAMESPACE, ...input });
  }

  async function getData(input: Partial<SecurityOverviewCodebasesInput> = {}) {
    const result = await getCodebases(input);
    if (result.state !== "data") {
      throw new Error(`Expected data, got ${result.state}`);
    }
    return result;
  }

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.stubEnv("DEFECTDOJO_URL", "http://defectdojo.example.test");
    vi.stubEnv("DEFECTDOJO_TOKEN", "service-token");
    givenCluster(CLUSTER);
    givenDefectDojo();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    clearSecurityOverviewCache();
    doubles.defectDojo = null;
  });

  describe("the scans of a codebase", () => {
    it("are the newest test of each branch, scanner and image, counted by severity; two scanners of one image are two scans", async () => {
      const { codebases } = await getData();

      expect(codebases).toHaveLength(1);
      expect(codebases[0]).toMatchObject({ codebase: DEMO_CODEBASE, known: true });
      expect(
        codebases[0].scans.map(({ ref, ownImage, counts }) => [ref.level, ref.scanner, ref.image, ownImage, counts])
      ).toEqual([
        ["code", SEMGREP, null, false, { Critical: 1, High: 1, Medium: 0, Low: 0, Info: 0 }],
        ["code", GITLEAKS, null, false, { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 }],
        ["image", TRIVY, DEMO_IMAGE, true, { Critical: 0, High: 3, Medium: 0, Low: 0, Info: 0 }],
        ["image", GRYPE, DEMO_IMAGE, true, { Critical: 0, High: 2, Medium: 0, Low: 0, Info: 0 }],
        ["image", TRIVY, THIRD_PARTY_IMAGE, false, { Critical: 0, High: 0, Medium: 0, Low: 1, Info: 0 }],
      ]);
      expect(codebases[0].scans[0]).toMatchObject({ testUrl: TESTS[1].url, date: TESTS[1].updated, version: "" });
    });

    it("are those of its CodebaseBranches; a caller who may not list the CodebaseBranches sees every branch, the default first", async () => {
      givenDefectDojo({ tests: [...TESTS, OLD_BRANCH_TEST, FEATURE_TEST] });
      const branchesOf = (result: { codebases: { scans: { ref: { branch: string } }[] }[] }) => [
        ...new Set(result.codebases[0].scans.map(({ ref }) => ref.branch)),
      ];

      expect(branchesOf(await getData())).toEqual(["main", "feature/x"]);

      givenCluster(CLUSTER, { forbidden: [k8sCodebaseBranchConfig] });
      expect(branchesOf(await getData())).toEqual(["main", "feature/x", "old"]);
    });
  });

  describe("the branches of a codebase", () => {
    it("are matched as written when they and the default branch are spelled in upper case: the branch of a test is no tag", async () => {
      givenCluster([makeCodebase(DEMO_CODEBASE, "Main"), makeBranch("Release-1.0"), makeBranch("Main")]);
      givenDefectDojo({
        tests: ["Release-1.0", "Main"].map((branchTag, index) =>
          makeTest({ id: 30 + index, scanType: SEMGREP, branchTag })
        ),
      });

      const { codebases } = await getData();

      expect(codebases[0].scans.map(({ ref }) => ref.branch)).toEqual(["Main", "Release-1.0"]);
    });
  });

  describe("the totals of a level", () => {
    it("are a line per scan type, adding the scans of that scan type: two scanners of one image are never added", async () => {
      givenDefectDojo({ tests: [...TESTS, ...GONE_TESTS] });

      const { codebases } = await getData();

      expect(scanTypeLines(codebases, "image")).toEqual([
        { scanType: TRIVY, counts: { Critical: 0, High: 3, Medium: 0, Low: 1, Info: 0 }, size: 2 },
        { scanType: GRYPE, counts: { Critical: 0, High: 2, Medium: 0, Low: 0, Info: 0 }, size: 1 },
      ]);
      expect(scanTypeLines(codebases, "code")).toEqual([
        { scanType: SEMGREP, counts: { Critical: 1, High: 1, Medium: 0, Low: 0, Info: 0 }, size: 3 },
        { scanType: GITLEAKS, counts: { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 }, size: 1 },
      ]);
    });
  });

  describe("the codebases", () => {
    it("are by name; a codebase tag without a Codebase is shown with every branch and no link, a Codebase without a scan is named", async () => {
      givenCluster([...CLUSTER, makeCodebase("idle-app"), makeBranch("main", "idle-app")]);
      givenDefectDojo({ tests: [...TESTS, ...GONE_TESTS] });

      const { codebases, unscanned } = await getData();

      expect(codebases.map(({ codebase, known }) => [codebase, known])).toEqual([
        [DEMO_CODEBASE, true],
        ["gone-app", false],
      ]);
      expect(codebases[1].scans.map(({ ref }) => ref.branch)).toEqual(["develop", "main"]);
      expect(unscanned).toEqual(["idle-app"]);
    });

    it("name a Codebase whose scans are all of deleted branches as without scan data", async () => {
      givenDefectDojo({ tests: [OLD_BRANCH_TEST] });

      await expect(getCodebases()).resolves.toEqual({ state: "noScanData", unscanned: [DEMO_CODEBASE] });
    });

    it("are not linked or named without scan data for a caller who may not list the Codebases", async () => {
      givenCluster(CLUSTER, { forbidden: [k8sCodebaseConfig] });

      const { codebases, unscanned } = await getData();

      expect(codebases.map(({ codebase, known }) => [codebase, known])).toEqual([[DEMO_CODEBASE, false]]);
      expect(unscanned).toEqual([]);
    });

    it("say of no image whose it is for a caller who may not list the CodebaseImageStreams", async () => {
      givenCluster(CLUSTER, { forbidden: [k8sCodebaseImageStreamConfig] });

      const { codebases } = await getData();

      expect(codebases[0].scans.map(({ ref, ownImage }) => [ref.level, ownImage])).toEqual([
        ["code", null],
        ["code", null],
        ["image", null],
        ["image", null],
        ["image", null],
      ]);
    });

    it("leave out a test without a branch, and read an image tag without a value as no image", async () => {
      givenCluster(CLUSTER, { forbidden: [k8sCodebaseBranchConfig] });
      givenDefectDojo({
        tests: [
          ...TESTS,
          makeTest({ id: 30, scanType: SEMGREP, branchTag: "" }),
          makeTest({ id: 31, scanType: GRYPE, tags: [...codebaseTags(), "oci-image:"] }),
          makeTest({ id: 32, scanType: SEMGREP, branchTag: "", tags: codebaseTags("gone-app") }),
        ],
      });

      const { codebases } = await getData();

      expect(codebases.map(({ codebase }) => codebase)).toEqual([DEMO_CODEBASE]);
      expect(codebases[0].scans.map(({ ref }) => [ref.branch, ref.scanner, ref.image])).toEqual([
        ["main", SEMGREP, null],
        ["main", GITLEAKS, null],
        ["main", TRIVY, DEMO_IMAGE],
        ["main", GRYPE, DEMO_IMAGE],
        ["main", GRYPE, null],
        ["main", TRIVY, THIRD_PARTY_IMAGE],
      ]);
    });
  });

  describe("the reads of DefectDojo", () => {
    it("serve every caller from one read: one list of the tenant's tests and a count per scan of every branch", async () => {
      const defectDojo = givenDefectDojo({ tests: [...TESTS, OLD_BRANCH_TEST] });
      const listTests = vi.spyOn(defectDojo, "listTests");
      const counts = vi.spyOn(defectDojo, "getSeverityCounts");

      const first = await getData();
      givenCluster(CLUSTER, { forbidden: [k8sCodebaseBranchConfig] });
      mockContext = createMockedContext();
      const next = await getData();

      expect(listTests).toHaveBeenCalledTimes(1);
      expect(listTests).toHaveBeenCalledWith({ tags: [`app.edp.epam.com/tenant:${DEMO_NAMESPACE}`] });
      // Five scans of main and one of the branch "old": the caller's branches do not shape what is read.
      expect(counts).toHaveBeenCalledTimes(6);
      expect(first.codebases[0].scans).toHaveLength(5);
      expect(next.codebases[0].scans).toHaveLength(6);
    });

    it("are kept apart for each state and each tenant", async () => {
      const defectDojo = givenDefectDojo();
      const listTests = vi.spyOn(defectDojo, "listTests");

      await getData();
      await getData({ state: "mitigated" });
      await getCodebases({ namespace: "other" });

      expect(listTests.mock.calls.map(([filter]) => filter.tags)).toEqual([
        [`app.edp.epam.com/tenant:${DEMO_NAMESPACE}`],
        [`app.edp.epam.com/tenant:${DEMO_NAMESPACE}`],
        ["app.edp.epam.com/tenant:other"],
      ]);
    });
  });

  describe("a state", () => {
    it("counts the findings of that state, Mitigated too", async () => {
      givenDefectDojo({
        findings: { ...FINDINGS, 2: [...FINDINGS[2], makeTriagedFinding({ id: 290, testId: 2, severity: "Medium" })] },
      });

      const { codebases } = await getData({ state: "mitigated" });

      expect(codebases[0].scans[0].counts).toEqual({ Critical: 0, High: 0, Medium: 1, Low: 0, Info: 0 });
    });
  });

  describe("the states", () => {
    it.each([
      ["URL", "DEFECTDOJO_URL"],
      ["token", "DEFECTDOJO_TOKEN"],
    ])("say DefectDojo is not configured without the %s, and read nothing from the cluster", async (_, variable) => {
      vi.stubEnv(variable, "");
      vi.mocked(K8sClient).mockClear();

      await expect(getCodebases()).resolves.toEqual({ state: "notConfigured" });
      expect(K8sClient).not.toHaveBeenCalled();
    });

    it("say no scan data when the tenant has no CI test, and name its Codebases", async () => {
      givenDefectDojo({ tests: [] });

      await expect(getCodebases()).resolves.toEqual({ state: "noScanData", unscanned: [DEMO_CODEBASE] });
    });

    it("say DefectDojo is unreachable, and ask it again on the next call: an outage is not kept", async () => {
      givenDefectDojo({ outage: "unreachable", outageOn: ["getSeverityCounts"] });
      await expect(getCodebases()).resolves.toEqual({ state: "unreachable" });

      givenDefectDojo();
      await expect(getCodebases()).resolves.toMatchObject({ state: "data" });
    });
  });
});
