import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SecuritySeverity } from "@my-project/shared";
import {
  DEFECTDOJO_SEVERITY_LABELS,
  SEVERITY_LISTING_LIMIT,
  DefectDojoClient,
  type DefectDojoEngagement,
  type DefectDojoFinding,
  type DefectDojoPrefetchedEngagement,
  type DefectDojoTest,
} from "../../clients/defectdojo/index.js";
import { getCodebaseSummary, getEnvironmentSummary, getFindingsPage } from "./summaries.js";

const WEB = "https://dd.example.com";
const TENANT = "krci";
const TENANT_TAG = "krci-tenant:krci";

const ENGAGEMENTS: DefectDojoEngagement[] = [
  { id: 4, name: "runtime:demo-dev", product: 3 },
  { id: 3, name: "code-security-main", product: 3 },
  { id: 2, name: "image:busybox", product: 3 },
  { id: 9, name: "manual pentest", product: 3 },
];

const TESTS: Record<number, DefectDojoTest[]> = {
  2: [
    {
      id: 17,
      title: "Trivy Scan",
      engagement: 2,
      tags: [],
      test_type_name: "Trivy Scan",
      version: "",
      updated: "2026-11-10T19:57:35.778467Z",
    },
    {
      id: 18,
      title: "Anchore Grype",
      engagement: 2,
      tags: [],
      test_type_name: "Anchore Grype",
      version: "1.38.0",
      updated: "2026-11-10T19:57:35.945959Z",
    },
  ],
  3: [
    {
      id: 19,
      title: "Semgrep JSON Report",
      engagement: 3,
      tags: [],
      test_type_name: "Semgrep JSON Report",
      updated: "2026-11-10T20:18:32.326467Z",
    },
    {
      id: 20,
      title: "Gitleaks Scan",
      engagement: 3,
      tags: [],
      test_type_name: "Gitleaks Scan",
      updated: "2026-11-10T20:18:32.486324Z",
    },
  ],
  4: [
    {
      id: 21,
      title: "VulnerabilityReport deployment/test-go-app/test-go-app",
      engagement: 4,
      tags: [
        "krci-scope:runtime",
        TENANT_TAG,
        "krci-env:demo.dev",
        "krci-codebase:test-go-app",
        "krci-workload:deployment.test-go-app",
      ],
      test_type_name: "Trivy Operator Scan",
      version: "main-20261110-194848",
      updated: "2026-11-10T20:41:41.682710Z",
    },
    {
      id: 22,
      title: "ExposedSecretReport deployment/test-go-app/test-go-app",
      engagement: 4,
      tags: [
        "krci-scope:runtime",
        TENANT_TAG,
        "krci-env:demo.dev",
        "krci-codebase:test-go-app",
        "krci-workload:deployment.test-go-app",
      ],
      test_type_name: "Trivy Operator Scan",
      version: "main-20261110-194848",
      updated: "2026-11-10T20:41:30.000000Z",
    },
  ],
  9: [{ id: 30, title: "Manual", engagement: 9, tags: [] }],
};

const COUNTS: Record<number, Partial<Record<SecuritySeverity, number>>> = {
  2: { high: 3 },
  3: {},
  4: { unassigned: 54 },
};

const ZERO = { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 };

function stubDefectDojo(): DefectDojoClient {
  const client = new DefectDojoClient({ apiBaseURL: WEB, apiKey: "key", webBaseURL: WEB });

  vi.spyOn(client, "getProductByName").mockResolvedValue({ id: 3, name: "test-go-app" });
  vi.spyOn(client, "listEngagements").mockResolvedValue(ENGAGEMENTS);
  vi.spyOn(client, "listTestsByEngagement").mockImplementation(async (id) => ({
    tests: TESTS[id] ?? [],
    engagements: new Map(),
  }));
  vi.spyOn(client, "listFindingSeverities").mockImplementation(async ({ engagementIds }, limit) => {
    const labels = Object.entries(COUNTS[engagementIds[0]] ?? {}).flatMap(([severity, count]) =>
      Array<string>(count).fill(DEFECTDOJO_SEVERITY_LABELS[severity as SecuritySeverity])
    );
    return { count: labels.length, severities: labels.slice(0, limit) };
  });
  vi.spyOn(client, "countFindings").mockImplementation(async ({ engagementIds, severities }) => {
    const [engagementId] = engagementIds;
    const [severity] = severities ?? [];
    return (severity && COUNTS[engagementId]?.[severity]) || 0;
  });

  return client;
}

describe("getCodebaseSummary", () => {
  let client: DefectDojoClient;

  beforeEach(() => {
    client = stubDefectDojo();
  });

  it("summarizes the CI and runtime scans of the codebase", async () => {
    const summary = await getCodebaseSummary(client, "test-go-app", TENANT);

    expect(summary).toEqual({
      status: "OK",
      codebase: "test-go-app",
      ci: [
        {
          kind: "code",
          engagement: "code-security-main",
          branch: "main",
          tools: ["Gitleaks Scan", "Semgrep JSON Report"],
          counts: ZERO,
          updated: "2026-11-10T20:18:32.486324Z",
          link: `${WEB}/engagement/3`,
        },
        {
          kind: "image",
          engagement: "image:busybox",
          image: "busybox",
          tag: "1.38.0",
          tools: ["Anchore Grype", "Trivy Scan"],
          counts: { ...ZERO, high: 3 },
          updated: "2026-11-10T19:57:35.945959Z",
          link: `${WEB}/engagement/2`,
        },
      ],
      runtime: [
        {
          environment: "demo/dev",
          workloads: ["deployment/test-go-app"],
          versions: ["main-20261110-194848"],
          tools: ["Trivy Operator Scan"],
          counts: { ...ZERO, unassigned: 54 },
          updated: "2026-11-10T20:41:41.682710Z",
          link: `${WEB}/engagement/4`,
        },
      ],
      link: `${WEB}/product/3`,
    });
  });

  it("lists the findings of each engagement once and counts severities only above the listing limit", async () => {
    await getCodebaseSummary(client, "test-go-app", TENANT);

    expect(client.listFindingSeverities).toHaveBeenCalledTimes(3);
    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [2], testTags: undefined },
      SEVERITY_LISTING_LIMIT
    );
    expect(client.countFindings).toHaveBeenCalledTimes(4);
    expect(client.countFindings).toHaveBeenCalledWith({
      engagementIds: [4],
      testTags: [TENANT_TAG, "krci-env:demo.dev"],
      severities: ["critical"],
    });
  });

  it("leaves out engagements that hold neither CI nor runtime scans", async () => {
    await getCodebaseSummary(client, "test-go-app", TENANT);

    expect(client.listTestsByEngagement).toHaveBeenCalledWith(9);
    expect(client.listFindingSeverities).not.toHaveBeenCalledWith(
      expect.objectContaining({ engagementIds: [9] }),
      expect.anything()
    );
  });

  it("names the environment after the engagement when its tests carry no environment tag", async () => {
    vi.spyOn(client, "listEngagements").mockResolvedValue([{ id: 4, name: "runtime:demo-dev", product: 3 }]);
    vi.spyOn(client, "listTestsByEngagement").mockResolvedValue({
      tests: [{ id: 21, title: "x", engagement: 4, tags: [TENANT_TAG] }],
      engagements: new Map(),
    });

    const summary = await getCodebaseSummary(client, "test-go-app", TENANT);

    expect(summary.runtime[0]).toMatchObject({ environment: "demo-dev", workloads: [], versions: [] });
  });

  it("orders runtime environments by name", async () => {
    vi.spyOn(client, "listEngagements").mockResolvedValue([
      { id: 5, name: "runtime:b-prod", product: 3 },
      { id: 4, name: "runtime:a-dev", product: 3 },
    ]);
    vi.spyOn(client, "listTestsByEngagement").mockImplementation(async (id) => ({
      tests: [
        {
          id,
          title: "x",
          engagement: id,
          tags: [TENANT_TAG, `krci-env:${id === 5 ? "b.prod" : "a.dev"}`],
        },
      ],
      engagements: new Map(),
    }));

    const summary = await getCodebaseSummary(client, "test-go-app", TENANT);

    expect(summary.runtime.map((row) => row.environment)).toEqual(["a/dev", "b/prod"]);
  });

  it("leaves out the runtime rows of other tenants and counts the rest with the tenant and environment tags", async () => {
    vi.spyOn(client, "listEngagements").mockResolvedValue([
      { id: 4, name: "runtime:demo-dev", product: 3 },
      { id: 5, name: "runtime:foreign-dev", product: 3 },
    ]);
    vi.spyOn(client, "listTestsByEngagement").mockImplementation(async (id) => ({
      tests:
        id === 4
          ? [
              { id: 40, title: "x", engagement: 4, tags: [TENANT_TAG, "krci-env:demo.dev"] },
              { id: 41, title: "x", engagement: 4, tags: ["krci-tenant:other-tenant", "krci-env:demo.dev"] },
            ]
          : [{ id: 50, title: "x", engagement: 5, tags: ["krci-tenant:other-tenant", "krci-env:foreign.dev"] }],
      engagements: new Map(),
    }));

    const summary = await getCodebaseSummary(client, "test-go-app", TENANT);

    expect(summary.runtime.map((row) => row.environment)).toEqual(["demo/dev"]);
    expect(client.listFindingSeverities).toHaveBeenCalledTimes(1);
    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [4], testTags: [TENANT_TAG, "krci-env:demo.dev"] },
      SEVERITY_LISTING_LIMIT
    );
  });

  it("answers NONE for a codebase DefectDojo does not know", async () => {
    vi.spyOn(client, "getProductByName").mockResolvedValue(null);

    expect(await getCodebaseSummary(client, "unknown", TENANT)).toEqual({
      status: "NONE",
      codebase: "unknown",
      ci: [],
      runtime: [],
    });
    expect(client.listEngagements).not.toHaveBeenCalled();
  });

  it("answers NONE for a product without scans", async () => {
    vi.spyOn(client, "listEngagements").mockResolvedValue([{ id: 9, name: "manual pentest", product: 3 }]);

    expect(await getCodebaseSummary(client, "test-go-app", TENANT)).toEqual({
      status: "NONE",
      codebase: "test-go-app",
      ci: [],
      runtime: [],
    });
    expect(client.listFindingSeverities).not.toHaveBeenCalled();
  });
});

describe("getEnvironmentSummary", () => {
  function prefetched(id: number, product: string, productId = id * 10): DefectDojoPrefetchedEngagement {
    return { id, name: `runtime:demo-dev`, product: { id: productId, name: product } };
  }

  function runtimeTest(id: number, engagement: number, workload: string, version: string): DefectDojoTest {
    return {
      id,
      title: "x",
      engagement,
      tags: [TENANT_TAG, "krci-env:demo.dev", `krci-workload:deployment.${workload}`],
      version,
      test_type_name: "Trivy Operator Scan",
      updated: "2026-11-10T20:00:00.000000Z",
    };
  }

  let client: DefectDojoClient;

  beforeEach(() => {
    client = stubDefectDojo();
    vi.spyOn(client, "listTestsByTags").mockResolvedValue({
      tests: [
        runtimeTest(1, 4, "test-go-app", "main-1"),
        runtimeTest(2, 4, "test-go-app-worker", "main-1"),
        runtimeTest(3, 8, "nginx", "1.27"),
        runtimeTest(4, 7, "api", "v3"),
      ],
      engagements: new Map([
        [4, prefetched(4, "test-go-app")],
        [8, prefetched(8, "env:demo-dev")],
        [7, prefetched(7, "api-service")],
      ]),
    });
  });

  it("summarizes the applications and the workloads of no codebase", async () => {
    const summary = await getEnvironmentSummary(client, "demo", "dev", TENANT);

    expect(client.listTestsByTags).toHaveBeenCalledWith([TENANT_TAG, "krci-env:demo.dev"]);
    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [4], testTags: [TENANT_TAG, "krci-env:demo.dev"] },
      SEVERITY_LISTING_LIMIT
    );
    expect(summary).toEqual({
      status: "OK",
      environment: "demo/dev",
      applications: [
        {
          codebase: "api-service",
          workloads: ["deployment/api"],
          versions: ["v3"],
          counts: ZERO,
          updated: "2026-11-10T20:00:00.000000Z",
          link: `${WEB}/engagement/7`,
        },
        {
          codebase: "test-go-app",
          workloads: ["deployment/test-go-app", "deployment/test-go-app-worker"],
          versions: ["main-1"],
          counts: { ...ZERO, unassigned: 54 },
          updated: "2026-11-10T20:00:00.000000Z",
          link: `${WEB}/engagement/4`,
        },
      ],
      other: {
        counts: ZERO,
        workloads: ["deployment/nginx"],
        updated: "2026-11-10T20:00:00.000000Z",
        link: `${WEB}/engagement/8`,
      },
    });
  });

  it("merges the engagements of one codebase product into one row", async () => {
    vi.spyOn(client, "listTestsByTags").mockResolvedValue({
      tests: [
        { ...runtimeTest(1, 4, "web", "main-1"), updated: "2026-11-10T20:00:00.000000Z" },
        { ...runtimeTest(2, 5, "worker", "main-2"), updated: "2026-11-10T21:00:00.000000Z" },
      ],
      engagements: new Map([
        [4, prefetched(4, "test-go-app", 40)],
        [5, prefetched(5, "test-go-app", 40)],
      ]),
    });

    const summary = await getEnvironmentSummary(client, "demo", "dev", TENANT);

    expect(summary.applications).toEqual([
      {
        codebase: "test-go-app",
        workloads: ["deployment/web", "deployment/worker"],
        versions: ["main-1", "main-2"],
        counts: { ...ZERO, unassigned: 54 },
        updated: "2026-11-10T21:00:00.000000Z",
        link: `${WEB}/product/40`,
      },
    ]);
    expect(summary.other).toBeUndefined();
    expect(client.listFindingSeverities).toHaveBeenCalledTimes(1);
    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [4, 5], testTags: [TENANT_TAG, "krci-env:demo.dev"] },
      SEVERITY_LISTING_LIMIT
    );
  });

  it("merges the engagements of the environment product into one `other` row", async () => {
    vi.spyOn(client, "listTestsByTags").mockResolvedValue({
      tests: [runtimeTest(1, 8, "nginx", "1.27"), runtimeTest(2, 9, "redis", "7")],
      engagements: new Map([
        [8, prefetched(8, "env:demo-dev", 80)],
        [9, prefetched(9, "env:demo-dev", 80)],
      ]),
    });

    const summary = await getEnvironmentSummary(client, "demo", "dev", TENANT);

    expect(summary.applications).toEqual([]);
    expect(summary.other).toMatchObject({
      workloads: ["deployment/nginx", "deployment/redis"],
      link: `${WEB}/product/80`,
    });
    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [8, 9], testTags: [TENANT_TAG, "krci-env:demo.dev"] },
      SEVERITY_LISTING_LIMIT
    );
  });

  it("has no `other` when every workload belongs to a codebase", async () => {
    vi.spyOn(client, "listTestsByTags").mockResolvedValue({
      tests: [runtimeTest(1, 4, "test-go-app", "main-1")],
      engagements: new Map([[4, prefetched(4, "test-go-app")]]),
    });

    const summary = await getEnvironmentSummary(client, "demo", "dev", TENANT);

    expect(summary.other).toBeUndefined();
    expect(summary.applications).toHaveLength(1);
  });

  it("answers NONE for an environment without scans", async () => {
    vi.spyOn(client, "listTestsByTags").mockResolvedValue({ tests: [], engagements: new Map() });

    expect(await getEnvironmentSummary(client, "demo", "qa", TENANT)).toEqual({
      status: "NONE",
      environment: "demo/qa",
      applications: [],
    });
    expect(client.listFindingSeverities).not.toHaveBeenCalled();
  });
});

describe("getFindingsPage", () => {
  const BASE = { codebase: "test-go-app", scope: "runtime" as const, page: 1, pageSize: 25 };

  const RUNTIME_FINDING: DefectDojoFinding = {
    id: 9105,
    title: "CVE-2026-14456 Libcrypto3 3.5.6-r0",
    severity: "Info",
    test: 21,
    vulnerability_ids: [{ vulnerability_id: "CVE-2026-14456" }],
    component_name: "libcrypto3",
    component_version: "3.5.6-r0",
    fix_available: true,
    mitigation: "3.5.8-r0",
  };

  const CODE_FINDING: DefectDojoFinding = {
    id: 9300,
    title: "Hardcoded secret",
    severity: "Critical",
    test: 20,
    file_path: "cmd/main.go",
    fix_available: false,
    mitigation: "Move the secret out of the repository",
  };

  let client: DefectDojoClient;

  beforeEach(() => {
    client = stubDefectDojo();
    vi.spyOn(client, "listFindings").mockImplementation(async ({ engagementIds }) => {
      const runtime = engagementIds.includes(4);
      return {
        totalCount: 1,
        findings: [runtime ? RUNTIME_FINDING : CODE_FINDING],
        tests: new Map(runtime ? [[21, TESTS[4][0]]] : [[20, TESTS[3][1]]]),
      };
    });
  });

  it("maps the findings of both scopes", async () => {
    const [ci, runtime] = await Promise.all([
      getFindingsPage(client, { ...BASE, scope: "ci" }, TENANT),
      getFindingsPage(client, BASE, TENANT),
    ]);

    expect([...ci.items, ...runtime.items]).toEqual([
      {
        id: 9300,
        severity: "critical",
        title: "Hardcoded secret",
        component: "cmd/main.go",
        version: "",
        scope: "ci",
        branch: "main",
        engagement: "code-security-main",
        link: `${WEB}/finding/9300`,
      },
      {
        id: 9105,
        severity: "unassigned",
        title: "CVE-2026-14456 Libcrypto3 3.5.6-r0",
        vulnId: "CVE-2026-14456",
        component: "libcrypto3",
        version: "3.5.6-r0",
        fixedVersion: "3.5.8-r0",
        scope: "runtime",
        environment: "demo/dev",
        workload: "deployment/test-go-app",
        engagement: "runtime:demo-dev",
        link: `${WEB}/finding/9105`,
      },
    ]);
  });

  it("reads the requested page of the CI engagements, without tag filter", async () => {
    await getFindingsPage(client, { ...BASE, scope: "ci", page: 3, pageSize: 10 }, TENANT);

    expect(client.listFindings).toHaveBeenCalledWith(
      { engagementIds: [3, 2], severities: undefined, testTags: undefined },
      { offset: 20, limit: 10 }
    );
  });

  it("prefers fix_version over the mitigation text", async () => {
    vi.spyOn(client, "listFindings").mockResolvedValue({
      totalCount: 1,
      findings: [{ ...RUNTIME_FINDING, fix_version: "9.9.9" }],
      tests: new Map([[21, TESTS[4][0]]]),
    });

    const page = await getFindingsPage(client, BASE, TENANT);

    expect(page.items[0].fixedVersion).toBe("9.9.9");
  });

  it("falls back from empty strings the way missing values do", async () => {
    vi.spyOn(client, "listFindings").mockResolvedValue({
      totalCount: 1,
      findings: [
        {
          ...RUNTIME_FINDING,
          vulnerability_ids: [{ vulnerability_id: "" }],
          component_name: "",
          file_path: "pkg/lib.go",
          component_version: null,
          fix_version: "",
          fix_available: true,
          mitigation: "",
        },
      ],
      tests: new Map([[21, TESTS[4][0]]]),
    });

    const [item] = (await getFindingsPage(client, BASE, TENANT)).items;

    expect(item.vulnId).toBeUndefined();
    expect(item.component).toBe("pkg/lib.go");
    expect(item.version).toBe("");
    expect(item.fixedVersion).toBeUndefined();
  });

  it("restricts runtime findings to the tenant", async () => {
    await getFindingsPage(client, BASE, TENANT);

    expect(client.listFindings).toHaveBeenCalledWith(
      { engagementIds: [4], severities: undefined, testTags: [TENANT_TAG] },
      expect.anything()
    );
  });

  it("leaves out a runtime engagement that has no test of the tenant", async () => {
    vi.spyOn(client, "listTestsByEngagement").mockImplementation(async (id) => ({
      tests: id === 4 ? [{ id: 41, title: "x", engagement: 4, tags: ["krci-tenant:other-tenant"] }] : [],
      engagements: new Map(),
    }));

    const page = await getFindingsPage(client, BASE, TENANT);

    expect(page.status).toBe("NONE");
    expect(client.listFindings).not.toHaveBeenCalled();
  });

  it("restricts the findings to the tenant and an environment", async () => {
    vi.spyOn(client, "listFindings").mockResolvedValue({
      totalCount: 1,
      findings: [RUNTIME_FINDING],
      tests: new Map([[21, TESTS[4][0]]]),
    });

    await getFindingsPage(client, { ...BASE, environment: "demo/dev", severity: ["critical", "high"] }, TENANT);

    expect(client.listFindings).toHaveBeenCalledWith(
      { engagementIds: [4], severities: ["critical", "high"], testTags: [TENANT_TAG, "krci-env:demo.dev"] },
      expect.anything()
    );
  });

  it("answers NONE for an environment the codebase does not run in", async () => {
    const page = await getFindingsPage(client, { ...BASE, environment: "demo/prod" }, TENANT);

    expect(page).toEqual({ status: "NONE", items: [], totalCount: 0, page: 1, pageSize: 25 });
    expect(client.listFindings).not.toHaveBeenCalled();
  });

  it("rejects an environment of the CI scope", async () => {
    await expect(
      getFindingsPage(client, { ...BASE, scope: "ci", environment: "demo/dev" }, TENANT)
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(client.getProductByName).not.toHaveBeenCalled();
  });

  it("answers NONE for a codebase DefectDojo does not know", async () => {
    vi.spyOn(client, "getProductByName").mockResolvedValue(null);

    expect(await getFindingsPage(client, BASE, TENANT)).toEqual({
      status: "NONE",
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
    });
    expect(client.listFindings).not.toHaveBeenCalled();
  });

  it("answers OK with no items when the severity filter matches nothing", async () => {
    vi.spyOn(client, "listFindings").mockResolvedValue({ totalCount: 0, findings: [], tests: new Map() });

    expect(await getFindingsPage(client, { ...BASE, severity: ["medium"] }, TENANT)).toEqual({
      status: "OK",
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
    });
  });

  it("fails on a finding of a test outside the requested engagements", async () => {
    vi.spyOn(client, "listFindings").mockResolvedValue({
      totalCount: 1,
      findings: [{ ...RUNTIME_FINDING, test: 999 }],
      tests: new Map(),
    });

    await expect(getFindingsPage(client, BASE, TENANT)).rejects.toThrow("outside the requested engagements");
  });
});
