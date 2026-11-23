import type { CodebaseScanRef, ScanFindings, ScanFindingsInput } from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import type { CodebaseFindingsSource } from "../../codebaseFindings/source.js";
import {
  DEMO_CODEBASE,
  DEMO_IMAGE,
  DEMO_NAMESPACE,
  GITLEAKS,
  GRYPE,
  SEMGREP,
  TRIVY,
  createFakeDefectDojo,
  givenCluster,
  makeFinding,
  makeImageTest,
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

const CODE_SCAN: CodebaseScanRef = { level: "code", branch: "main", scanner: SEMGREP, image: null };
const TRIVY_SCAN: CodebaseScanRef = { level: "image", branch: "main", scanner: TRIVY, image: DEMO_IMAGE };
const GRYPE_SCAN: CodebaseScanRef = { ...TRIVY_SCAN, scanner: GRYPE };

function givenDefectDojo(options: FakeDefectDojoOptions = {}): CodebaseFindingsSource {
  doubles.defectDojo = createFakeDefectDojo(options);
  return doubles.defectDojo;
}

describe("defectDojo.getScanFindings", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  async function getFindings(scan: CodebaseScanRef, filter: Partial<ScanFindingsInput> = {}): Promise<ScanFindings> {
    return createCaller(mockContext).defectDojo.getScanFindings({
      namespace: DEMO_NAMESPACE,
      name: DEMO_CODEBASE,
      scan,
      ...filter,
    });
  }

  async function getTitles(scan: CodebaseScanRef, filter: Partial<ScanFindingsInput> = {}): Promise<string[]> {
    const result = await getFindings(scan, filter);
    if (result.state !== "data") {
      throw new Error(`Expected data, got ${result.state}`);
    }
    return result.findings.map((finding) => finding.title);
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

  describe("the scan", () => {
    it("is resolved from its typed identity: the findings of the scanner asked for, not of its twin on the same image", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE }),
          makeImageTest({ id: 4, scanType: GRYPE, image: DEMO_IMAGE }),
        ],
        findings: {
          3: [makeFinding({ id: 31, testId: 3, title: "From Trivy" })],
          4: [makeFinding({ id: 41, testId: 4, title: "From Grype" })],
        },
      });

      expect(await getTitles(TRIVY_SCAN)).toEqual(["From Trivy"]);
      expect(await getTitles(GRYPE_SCAN)).toEqual(["From Grype"]);
    });

    it("is resolved by its image: the scan of a third-party image has its own findings", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE }),
          makeImageTest({ id: 4, scanType: TRIVY, image: "docker.io/library/nginx" }),
        ],
        findings: {
          3: [makeFinding({ id: 31, testId: 3, title: "In the own image" })],
          4: [makeFinding({ id: 41, testId: 4, title: "In nginx" })],
        },
      });

      expect(await getTitles({ ...TRIVY_SCAN, image: "docker.io/library/nginx" })).toEqual(["In nginx"]);
    });

    it("is looked up among the tests of its branch, scanner and image only", async () => {
      const defectDojo = givenDefectDojo({
        tests: [makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE })],
        findings: { 3: [makeFinding({ id: 31, testId: 3 })] },
      });
      const listTests = vi.spyOn(defectDojo, "listTests");

      await getFindings(TRIVY_SCAN);

      expect(listTests).toHaveBeenCalledWith({
        tags: ["app.edp.epam.com/codebase:demo-app", "app.edp.epam.com/tenant:krci", `oci-image:${DEMO_IMAGE}`],
        branchTag: "main",
        scanType: TRIVY,
      });
    });

    it("is not found for a scanner that is no scanner of its level, without a request to DefectDojo", async () => {
      const defectDojo = givenDefectDojo({ tests: [makeTest({ id: 1, scanType: SEMGREP })] });
      const listTests = vi.spyOn(defectDojo, "listTests");

      await expect(getFindings({ ...CODE_SCAN, scanner: TRIVY })).resolves.toEqual({ state: "noScanData" });
      expect(listTests).not.toHaveBeenCalled();
    });

    it("is the newest of the tests that share its branch, scanner and image", async () => {
      givenDefectDojo({
        tests: [
          makeImageTest({ id: 4, scanType: TRIVY, image: DEMO_IMAGE, updated: "2026-11-21T10:00:00Z" }),
          makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE, updated: "2026-11-23T10:00:00Z" }),
        ],
        findings: {
          3: [makeFinding({ id: 31, testId: 3, title: "From the newest" })],
          4: [makeFinding({ id: 41, testId: 4, title: "From the oldest" })],
        },
      });

      expect(await getTitles(TRIVY_SCAN)).toEqual(["From the newest"]);
    });

    it("is not found when its branch has no CodebaseBranch", async () => {
      givenDefectDojo({
        tests: [makeTest({ id: 1, scanType: SEMGREP, branchTag: "feature-login" })],
        findings: { 1: [makeFinding({ id: 11, testId: 1 })] },
      });

      await expect(getFindings({ ...CODE_SCAN, branch: "feature-login" })).resolves.toEqual({ state: "noScanData" });
    });

    it("is not found when no scan of the codebase has its identity", async () => {
      givenDefectDojo({ tests: [makeTest({ id: 1, scanType: SEMGREP })] });

      await expect(getFindings({ ...CODE_SCAN, scanner: GITLEAKS })).resolves.toEqual({ state: "noScanData" });
      await expect(getFindings(TRIVY_SCAN)).resolves.toEqual({ state: "noScanData" });
    });

    it("is read from the codebase of the request only", async () => {
      givenDefectDojo({
        tests: [
          makeTest({
            id: 1,
            scanType: SEMGREP,
            tags: ["app.edp.epam.com/codebase:other-app", "app.edp.epam.com/tenant:krci"],
          }),
        ],
        findings: { 1: [makeFinding({ id: 11, testId: 1 })] },
      });

      await expect(getFindings(CODE_SCAN)).resolves.toEqual({ state: "noScanData" });
    });
  });

  describe("the findings", () => {
    const tests = [makeTest({ id: 1, scanType: SEMGREP })];

    it("are the active ones by default, most severe first", async () => {
      givenDefectDojo({
        tests,
        findings: {
          1: [
            makeFinding({ id: 11, testId: 1, severity: "Low", title: "low" }),
            makeFinding({ id: 12, testId: 1, severity: "Critical", title: "critical" }),
            makeTriagedFinding({ id: 13, testId: 1, severity: "Critical", title: "mitigated" }),
            makeFinding({ id: 14, testId: 1, severity: "Medium", title: "medium" }),
          ],
        },
      });

      expect(await getTitles(CODE_SCAN)).toEqual(["critical", "medium", "low"]);
    });

    it("include the mitigated, false positive, out of scope and risk accepted ones when the switch is on, never a duplicate", async () => {
      givenDefectDojo({
        tests,
        findings: {
          1: [
            makeFinding({ id: 11, testId: 1, severity: "High", title: "active" }),
            makeTriagedFinding({ id: 12, testId: 1, severity: "High", title: "mitigated" }),
            makeFinding({
              id: 13,
              testId: 1,
              severity: "High",
              active: false,
              falsePositive: true,
              title: "false positive",
            }),
            makeFinding({
              id: 14,
              testId: 1,
              severity: "High",
              active: false,
              outOfScope: true,
              title: "out of scope",
            }),
            makeFinding({
              id: 15,
              testId: 1,
              severity: "High",
              active: false,
              riskAccepted: true,
              title: "risk accepted",
            }),
            makeFinding({ id: 16, testId: 1, severity: "High", duplicate: true, title: "duplicate" }),
          ],
        },
      });

      expect(await getTitles(CODE_SCAN, { showTriaged: true })).toEqual([
        "active",
        "mitigated",
        "false positive",
        "out of scope",
        "risk accepted",
      ]);
      expect(await getTitles(CODE_SCAN, { showTriaged: false })).toEqual(["active"]);
    });

    it("are filtered by severity", async () => {
      givenDefectDojo({
        tests,
        findings: {
          1: [
            makeFinding({ id: 11, testId: 1, severity: "High", title: "high" }),
            makeFinding({ id: 12, testId: 1, severity: "Low", title: "low" }),
          ],
        },
      });

      expect(await getTitles(CODE_SCAN, { severity: "Low" })).toEqual(["low"]);
    });

    it("come a page at a time, with the total of the filter", async () => {
      givenDefectDojo({
        tests,
        findings: {
          1: Array.from({ length: 5 }, (_, index) =>
            makeFinding({ id: 10 + index, testId: 1, title: `finding ${index}` })
          ),
        },
      });

      const second = await getFindings(CODE_SCAN, { page: 1, pageSize: 2 });

      expect(second).toMatchObject({ state: "data", total: 5 });
      expect(await getTitles(CODE_SCAN, { page: 1, pageSize: 2 })).toEqual(["finding 2", "finding 3"]);
      expect(await getTitles(CODE_SCAN, { page: 2, pageSize: 2 })).toEqual(["finding 4"]);
    });

    it("are an empty page, not no scan data, for a clean scan", async () => {
      givenDefectDojo({ tests });

      await expect(getFindings(CODE_SCAN)).resolves.toEqual({ state: "data", total: 0, findings: [] });
    });

    it("carry the component, the vulnerability id, the fix and the link to the finding", async () => {
      givenDefectDojo({
        tests: [makeImageTest({ id: 3, scanType: TRIVY, image: DEMO_IMAGE })],
        findings: {
          3: [
            makeFinding({
              id: 31,
              testId: 3,
              severity: "Critical",
              componentName: "libcrypto3",
              componentVersion: "3.1.0",
              vulnerabilityIds: ["CVE-2099-1001"],
              fixAvailable: true,
              fixVersion: "3.1.4",
            }),
          ],
        },
      });

      const result = await getFindings(TRIVY_SCAN);

      expect(result).toMatchObject({
        state: "data",
        findings: [
          {
            severity: "Critical",
            componentName: "libcrypto3",
            componentVersion: "3.1.0",
            vulnerabilityIds: ["CVE-2099-1001"],
            fixAvailable: true,
            fixVersion: "3.1.4",
            url: "https://defectdojo.example.test/finding/31",
          },
        ],
      });
    });

    it("carry the file and the line of a code finding, and no fix when the scanner says none", async () => {
      givenDefectDojo({
        tests,
        findings: { 1: [makeFinding({ id: 11, testId: 1, filePath: "cmd/main.go", line: 42 })] },
      });

      const result = await getFindings(CODE_SCAN);

      expect(result).toMatchObject({
        state: "data",
        findings: [{ filePath: "cmd/main.go", line: 42, fixAvailable: null, fixVersion: null }],
      });
    });

    it("leave out the fields the tab does not show", async () => {
      givenDefectDojo({ tests, findings: { 1: [makeFinding({ id: 11, testId: 1 })] } });

      const result = await getFindings(CODE_SCAN);

      expect(result.state === "data" && Object.keys(result.findings[0]).sort()).toEqual(
        [
          "active",
          "componentName",
          "componentVersion",
          "date",
          "falsePositive",
          "filePath",
          "fixAvailable",
          "fixVersion",
          "line",
          "mitigated",
          "outOfScope",
          "riskAccepted",
          "severity",
          "title",
          "underReview",
          "url",
          "vulnerabilityIds",
        ].sort()
      );
    });
  });

  describe("the states", () => {
    it("says DefectDojo is not configured, and reads nothing from the cluster", async () => {
      vi.stubEnv("DEFECTDOJO_URL", "");
      vi.mocked(K8sClient).mockClear();

      await expect(getFindings(CODE_SCAN)).resolves.toEqual({ state: "notConfigured" });
      expect(K8sClient).not.toHaveBeenCalled();
    });

    it.each([
      ["lists the tests", ["listTests"] as const],
      ["lists the findings", ["listFindings"] as const],
    ])("says DefectDojo is unreachable when it fails as it %s", async (_, outageOn) => {
      givenDefectDojo({
        outage: "unreachable",
        outageOn,
        tests: [makeTest({ id: 1, scanType: SEMGREP })],
        findings: { 1: [makeFinding({ id: 11, testId: 1 })] },
      });

      await expect(getFindings(CODE_SCAN)).resolves.toEqual({ state: "unreachable" });
    });
  });

  describe("the request", () => {
    it("rejects a caller with no session with UNAUTHORIZED", async () => {
      mockContext.session.user = undefined;

      await expect(getFindings(CODE_SCAN)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("answers NOT_FOUND for a codebase that does not exist", async () => {
      givenCluster([]);

      await expect(getFindings(CODE_SCAN)).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it.each([
      ["a page of 101 rows", { pageSize: 101 }],
      ["a negative page", { page: -1 }],
      ["a page beyond the last page of a scan", { page: 1001 }],
      ["a severity DefectDojo does not know", { severity: "Urgent" }],
    ])("rejects %s", async (_, filter) => {
      await expect(getFindings(CODE_SCAN, filter as Partial<ScanFindingsInput>)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });
});
