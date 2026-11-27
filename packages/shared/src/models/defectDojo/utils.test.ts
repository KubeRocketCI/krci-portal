import { describe, expect, it } from "vitest";
import { CODEBASE_SCAN_LEVELS, DEFECTDOJO_SEVERITIES, NO_FINDING_COUNTS, type DefectDojoLevel } from "./constants.js";
import { runtimeContainerRefSchema } from "./schemas.js";
import type { CodebaseScanRef, RunningEnvironmentContainer } from "./types.js";
import {
  compareOverviewNamespaces,
  hasActiveEnvironmentFindings,
  hasActiveFindings,
  hasActiveRuntimeFindings,
  hasFindingFilter,
  isCodebaseScanLevel,
  isRunningEnvironmentContainer,
  isRuntimeFindingState,
  mostSevereFirst,
  runtimeContainerKey,
  runtimeContainerRef,
  runtimeStateOf,
  scanRefKey,
  sumCounts,
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

describe("mostSevereFirst", () => {
  const counts = (Critical: number, High: number, Low = 0) => ({ ...NO_FINDING_COUNTS, Critical, High, Low });

  it("puts more Critical first, then more High, then more findings, and no counts last", () => {
    const ordered = [counts(0, 9, 9), null, counts(1, 0), counts(0, 9), counts(0, 0, 1)].sort(mostSevereFirst());

    expect(ordered).toEqual([counts(1, 0), counts(0, 9, 9), counts(0, 9), counts(0, 0, 1), null]);
  });

  it("ranks by one severity first when it is given", () => {
    expect([counts(5, 0, 1), counts(0, 0, 2)].sort(mostSevereFirst("Low"))).toEqual([counts(0, 0, 2), counts(5, 0, 1)]);
  });
});

describe("sumCounts", () => {
  it("adds the counts of each severity, and is zero for none", () => {
    expect(
      sumCounts([
        { ...NO_FINDING_COUNTS, High: 2, Info: 1 },
        { ...NO_FINDING_COUNTS, High: 3 },
      ])
    ).toEqual({
      ...NO_FINDING_COUNTS,
      High: 5,
      Info: 1,
    });
    expect(sumCounts([])).toEqual(NO_FINDING_COUNTS);
  });
});

describe("compareOverviewNamespaces", () => {
  const row = (
    cluster: string,
    namespace: string,
    { Critical = 0, Low = 0, secrets = 0, environment = false, managed = false, product = true } = {}
  ) => ({
    cluster,
    namespace,
    environment: environment ? { cdPipeline: "demo", stage: namespace } : null,
    managed,
    product: product
      ? {
          url: "",
          vulnerabilities: { ...NO_FINDING_COUNTS, Critical, Low },
          secrets: { ...NO_FINDING_COUNTS, High: secrets },
        }
      : null,
  });

  it("orders by cluster; in each, the Environments and the managed namespaces first, then the most severe, then by name", () => {
    const rows = [
      row("in-cluster", "other", { Critical: 9 }),
      row("in-cluster", "managed", { managed: true }),
      row("in-cluster", "prod", { environment: true, product: false }),
      row("in-cluster", "dev", { environment: true, Critical: 1 }),
      row("edge", "ingress"),
      row("in-cluster", "argocd", { Critical: 9 }),
    ];

    expect(rows.sort(compareOverviewNamespaces()).map(({ namespace }) => namespace)).toEqual([
      "ingress",
      "dev",
      "managed",
      "prod",
      "argocd",
      "other",
    ]);
  });

  it("ranks by one severity first when it is given", () => {
    const rows = [row("in-cluster", "a", { Critical: 9 }), row("in-cluster", "b", { Low: 1 })];

    expect(rows.sort(compareOverviewNamespaces("Low")).map(({ namespace }) => namespace)).toEqual(["b", "a"]);
  });

  it("ranks a namespace by the more severe of its vulnerabilities and its exposed secrets", () => {
    const rows = [row("in-cluster", "a", { Low: 1 }), row("in-cluster", "b", { secrets: 3 })];

    expect(rows.sort(compareOverviewNamespaces()).map(({ namespace }) => namespace)).toEqual(["b", "a"]);
  });

  it("puts a namespace with exposed secrets before one without, when their vulnerabilities rank the same", () => {
    const rows = [row("in-cluster", "a"), row("in-cluster", "b", { secrets: 2 })];

    expect(rows.sort(compareOverviewNamespaces()).map(({ namespace }) => namespace)).toEqual(["b", "a"]);
    expect(rows.sort(compareOverviewNamespaces("High")).map(({ namespace }) => namespace)).toEqual(["b", "a"]);
  });
});

describe("isCodebaseScanLevel", () => {
  it("is true for the levels a CI scan fills", () => {
    const levels: (DefectDojoLevel | null)[] = ["code", "image", "runtime", null];

    expect(levels.map(isCodebaseScanLevel)).toEqual([true, true, false, false]);
  });
});

describe("runtimeStateOf", () => {
  it("has no scan data without a container, is not running when none runs, then clean or data", () => {
    expect(runtimeStateOf({ containers: 0, running: 0, hasFindings: false })).toBe("noScanData");
    expect(runtimeStateOf({ containers: 2, running: 0, hasFindings: false })).toBe("notRunning");
    expect(runtimeStateOf({ containers: 2, running: 1, hasFindings: false })).toBe("clean");
    expect(runtimeStateOf({ containers: 2, running: 1, hasFindings: true })).toBe("data");
  });
});

describe("hasActiveEnvironmentFindings", () => {
  const container = (
    found: Pick<RunningEnvironmentContainer, "vulnerabilities" | "secrets">
  ): RunningEnvironmentContainer => ({
    workload: "deployment.demo",
    container: "demo",
    image: null,
    state: "running",
    ...found,
  });

  it.each([
    ["no report", { vulnerabilities: null, secrets: null }],
    ["no vulnerability report and no active secret", { vulnerabilities: null, secrets: 0 }],
    [
      "a vulnerability report without a finding and no secret report",
      { vulnerabilities: NO_FINDING_COUNTS, secrets: null },
    ],
  ])("is false for %s", (_, found) => {
    expect(hasActiveEnvironmentFindings(container(found))).toBe(false);
  });

  it.each([
    ["an exposed secret without a vulnerability report", { vulnerabilities: null, secrets: 1 }],
    ["an Info vulnerability only", { vulnerabilities: { ...NO_FINDING_COUNTS, Info: 1 }, secrets: 0 }],
  ])("is true for %s", (_, found) => {
    expect(hasActiveEnvironmentFindings(container(found))).toBe(true);
  });
});

describe("isRunningEnvironmentContainer", () => {
  it("tells a running container from one whose tests are all closed", () => {
    const place = { workload: "deployment.demo", container: "demo", image: null };

    expect(isRunningEnvironmentContainer({ ...place, state: "running", vulnerabilities: null, secrets: null })).toBe(
      true
    );
    expect(isRunningEnvironmentContainer({ ...place, state: "notRunning" })).toBe(false);
  });
});
