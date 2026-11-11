import { describe, expect, it, vi } from "vitest";
import {
  DefectDojoClient,
  SEVERITY_LISTING_LIMIT,
  type DefectDojoEngagement,
  type DefectDojoTest,
} from "../../clients/defectdojo/index.js";
import {
  classifyEngagement,
  countFindingRows,
  environmentOf,
  environmentTag,
  latestVersionOf,
  loadClassifiedEngagements,
  runtimeTestTags,
  sortedUnique,
  tenantTag,
  toolsOf,
  updatedOf,
  versionsOf,
  workloadsOf,
} from "./engagements.js";

function engagement(id: number, name: string): DefectDojoEngagement {
  return { id, name, product: 3 };
}

function test(overrides: Partial<DefectDojoTest> = {}): DefectDojoTest {
  return { id: 1, title: "Trivy Scan", engagement: 2, tags: [], ...overrides };
}

function createClient(): DefectDojoClient {
  return new DefectDojoClient({
    apiBaseURL: "https://dd.example.com",
    apiKey: "key",
    webBaseURL: "https://dd-web.example.com",
  });
}

describe("environmentTag", () => {
  it("joins cdPipeline and stage with a dot", () => {
    expect(environmentTag("demo", "dev")).toBe("krci-env:demo.dev");
  });
});

describe("tenantTag", () => {
  it("prefixes the namespace of the portal", () => {
    expect(tenantTag("krci")).toBe("krci-tenant:krci");
  });
});

describe("runtimeTestTags", () => {
  it("holds the tenant tag, and the environment tag when the environment is known", () => {
    expect(runtimeTestTags("krci")).toEqual(["krci-tenant:krci"]);
    expect(runtimeTestTags("krci", "demo")).toEqual(["krci-tenant:krci"]);
    expect(runtimeTestTags("krci", "demo", "dev")).toEqual(["krci-tenant:krci", "krci-env:demo.dev"]);
  });
});

describe("environmentOf", () => {
  it("reads <cdPipeline>/<stage> from the environment tag", () => {
    expect(environmentOf(["krci-scope:runtime", "krci-env:demo.dev"])).toBe("demo/dev");
  });

  it.each([[[]], [["krci-scope:runtime"]], [["krci-env:nodot"]], [["krci-env:.dev"]], [["krci-env:demo."]]])(
    "is undefined for %j",
    (tags) => {
      expect(environmentOf(tags)).toBeUndefined();
    }
  );
});

describe("workloadsOf", () => {
  it("reads <kind>/<name> from the workload tags", () => {
    expect(workloadsOf(["krci-workload:deployment.test-go-app", "krci-env:demo.dev"])).toEqual([
      "deployment/test-go-app",
    ]);
  });

  it("keeps a dot of the workload name", () => {
    expect(workloadsOf(["krci-workload:statefulset.db.v2"])).toEqual(["statefulset/db.v2"]);
  });
});

describe("classifyEngagement", () => {
  it("recognizes a code engagement and its branch", () => {
    expect(classifyEngagement(engagement(1, "code-security-main"), [])).toEqual({
      scope: "ci",
      kind: "code",
      branch: "main",
    });
  });

  it("keeps a slash of the branch", () => {
    expect(classifyEngagement(engagement(1, "code-security-release/1.0"), [])).toMatchObject({ branch: "release/1.0" });
  });

  it("recognizes an image engagement and its image", () => {
    expect(classifyEngagement(engagement(1, "image:registry.example.com/team/app"), [])).toEqual({
      scope: "ci",
      kind: "image",
      image: "registry.example.com/team/app",
    });
  });

  it("recognizes a runtime engagement by its name", () => {
    expect(classifyEngagement(engagement(1, "runtime:demo-dev"), [])).toEqual({ scope: "runtime" });
  });

  it("recognizes a runtime engagement by the scope tag of a tenant test", () => {
    expect(classifyEngagement(engagement(1, "anything"), [test({ tags: ["krci-scope:runtime"] })])).toEqual({
      scope: "runtime",
    });
  });

  it("ignores any other engagement", () => {
    expect(classifyEngagement(engagement(1, "manual pentest"), [test()])).toBeUndefined();
  });
});

describe("summaries of tests", () => {
  const tests = [
    test({ id: 1, test_type_name: "Trivy Scan", version: "v1", updated: "2026-11-10T10:00:00.000000Z" }),
    test({ id: 2, test_type_name: "Anchore Grype", version: "v2", updated: "2026-11-10T12:00:00.000000Z" }),
    test({ id: 3, scan_type: "Gitleaks Scan", version: "", updated: "2026-11-11T08:00:00.000000Z" }),
    test({ id: 4, title: "Semgrep JSON Report", updated: null }),
  ];

  it("lists the tools without duplicates, sorted", () => {
    expect(toolsOf([...tests, test({ test_type_name: "Trivy Scan" })])).toEqual([
      "Anchore Grype",
      "Gitleaks Scan",
      "Semgrep JSON Report",
      "Trivy Scan",
    ]);
  });

  it("lists the versions that are set", () => {
    expect(versionsOf(tests)).toEqual(["v1", "v2"]);
  });

  it("reports the newest update", () => {
    expect(updatedOf(tests)).toBe("2026-11-11T08:00:00.000000Z");
  });

  it("has no update when no test has one", () => {
    expect(updatedOf([test({ updated: null })])).toBeUndefined();
    expect(updatedOf([])).toBeUndefined();
  });

  it("takes the version of the newest test that has one", () => {
    expect(latestVersionOf(tests)).toBe("v2");
    expect(latestVersionOf([test({ version: "" })])).toBeUndefined();
  });

  it("sortedUnique sorts and de-duplicates", () => {
    expect(sortedUnique(["b", "a", "b"])).toEqual(["a", "b"]);
  });

  it("sortedUnique sorts mixed case alphabetically", () => {
    expect(sortedUnique(["trivy", "Gitleaks", "grype", "Anchore"])).toEqual(["Anchore", "Gitleaks", "grype", "trivy"]);
  });

  it("falls back from an empty tool name to the scan type, then to the title", () => {
    expect(
      toolsOf([
        test({ test_type_name: "", scan_type: "Gitleaks Scan" }),
        test({ test_type_name: null, scan_type: "", title: "Semgrep JSON Report" }),
        test({ test_type_name: "", scan_type: "", title: "Kubescape" }),
      ])
    ).toEqual(["Gitleaks Scan", "Kubescape", "Semgrep JSON Report"]);
  });
});

describe("loadClassifiedEngagements", () => {
  const TENANT = "krci";
  const TENANT_TAG = "krci-tenant:krci";

  function clientWithTests(engagements: DefectDojoEngagement[], tests: Record<number, DefectDojoTest[]>) {
    const client = createClient();
    vi.spyOn(client, "listEngagements").mockResolvedValue(engagements);
    vi.spyOn(client, "listTestsByEngagement").mockImplementation(async (id) => ({
      tests: tests[id] ?? [],
      engagements: new Map(),
    }));
    return client;
  }

  it("returns the CI and runtime engagements with their tests", async () => {
    const client = clientWithTests(
      [engagement(2, "image:busybox"), engagement(5, "manual pentest"), engagement(4, "runtime:demo-dev")],
      {
        2: [test({ id: 20, engagement: 2 })],
        5: [test({ id: 50, engagement: 5 })],
        4: [test({ id: 40, engagement: 4, tags: [TENANT_TAG] })],
      }
    );

    const loaded = await loadClassifiedEngagements(client, 3, TENANT);

    expect(loaded.map(({ engagement: e, kind }) => [e.id, kind.scope])).toEqual([
      [2, "ci"],
      [4, "runtime"],
    ]);
    expect(loaded[0].tests).toEqual([test({ id: 20, engagement: 2 })]);
  });

  it("keeps only the tenant tests of a runtime engagement", async () => {
    const client = clientWithTests([engagement(4, "runtime:demo-dev")], {
      4: [
        test({ id: 40, engagement: 4, tags: [TENANT_TAG] }),
        test({ id: 41, engagement: 4, tags: ["krci-tenant:other-tenant"] }),
        test({ id: 42, engagement: 4 }),
      ],
    });

    const loaded = await loadClassifiedEngagements(client, 3, TENANT);

    expect(loaded.map((entry) => entry.tests.map((t) => t.id))).toEqual([[40]]);
  });

  it("leaves out a runtime engagement without tenant tests", async () => {
    const client = clientWithTests([engagement(4, "runtime:demo-dev")], {
      4: [test({ id: 41, engagement: 4, tags: ["krci-tenant:other-tenant"] }), test({ id: 42, engagement: 4 })],
    });

    expect(await loadClassifiedEngagements(client, 3, TENANT)).toEqual([]);
  });

  it("does not take an engagement for runtime because of a foreign test's scope tag", async () => {
    const client = clientWithTests([engagement(6, "shared scans")], {
      6: [test({ id: 60, engagement: 6, tags: ["krci-scope:runtime", "krci-tenant:other-tenant"] })],
    });

    expect(await loadClassifiedEngagements(client, 3, TENANT)).toEqual([]);
  });

  it("takes an unnamed engagement for runtime by the scope tag of a tenant test", async () => {
    const client = clientWithTests([engagement(6, "shared scans")], {
      6: [test({ id: 60, engagement: 6, tags: ["krci-scope:runtime", TENANT_TAG] })],
    });

    const loaded = await loadClassifiedEngagements(client, 3, TENANT);

    expect(loaded.map((entry) => entry.kind.scope)).toEqual(["runtime"]);
  });
});

describe("countFindingRows", () => {
  const listing = (severities: string[], count = severities.length) => ({ count, severities });

  it("counts the severities of a filter at the listing limit from its rows", async () => {
    const client = createClient();
    const severities = [...Array<string>(SEVERITY_LISTING_LIMIT - 4).fill("Low"), "Critical", "High", "Medium", "Info"];
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing(severities));
    const countFindings = vi.spyOn(client, "countFindings");

    const [counts] = await countFindingRows(client, [{ engagementIds: [1] }]);

    expect(counts).toEqual({ critical: 1, high: 1, medium: 1, low: SEVERITY_LISTING_LIMIT - 4, unassigned: 1 });
    expect(countFindings).not.toHaveBeenCalled();
  });

  it("reads severities of unknown names as unassigned", async () => {
    const client = createClient();
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing(["Unknown"]));

    const [counts] = await countFindingRows(client, [{ engagementIds: [1] }]);

    expect(counts.unassigned).toBe(1);
  });

  it("counts a filter without findings as zero", async () => {
    const client = createClient();
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing([]));

    expect(await countFindingRows(client, [{ engagementIds: [1] }])).toEqual([
      { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 },
    ]);
  });

  it("counts a filter above the listing limit per severity, with the remainder unassigned", async () => {
    const client = createClient();
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing([], SEVERITY_LISTING_LIMIT + 11));
    const perSeverity = { critical: 1, high: 2, medium: 3, low: 4, unassigned: 99 };
    const countFindings = vi
      .spyOn(client, "countFindings")
      .mockImplementation(async ({ severities }) => perSeverity[severities?.[0] ?? "unassigned"]);

    const [counts] = await countFindingRows(client, [{ engagementIds: [1, 2], testTags: ["krci-env:demo.dev"] }]);

    expect(counts).toEqual({ critical: 1, high: 2, medium: 3, low: 4, unassigned: SEVERITY_LISTING_LIMIT + 1 });
    expect(countFindings).toHaveBeenCalledTimes(4);
    expect(countFindings).toHaveBeenCalledWith({
      engagementIds: [1, 2],
      testTags: ["krci-env:demo.dev"],
      severities: ["critical"],
    });
    expect(countFindings).not.toHaveBeenCalledWith(expect.objectContaining({ severities: ["unassigned"] }));
  });

  it("clamps the unassigned remainder at zero", async () => {
    const client = createClient();
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing([], SEVERITY_LISTING_LIMIT + 1));
    vi.spyOn(client, "countFindings").mockResolvedValue(SEVERITY_LISTING_LIMIT);

    const [counts] = await countFindingRows(client, [{ engagementIds: [1] }]);

    expect(counts.unassigned).toBe(0);
  });

  it("mixes listed and counted filters, keeping the order of the filters", async () => {
    const client = createClient();
    vi.spyOn(client, "listFindingSeverities").mockImplementation(async ({ engagementIds }) =>
      engagementIds[0] === 1 ? listing(["High"]) : listing([], SEVERITY_LISTING_LIMIT + 5)
    );
    vi.spyOn(client, "countFindings").mockResolvedValue(0);

    const counts = await countFindingRows(client, [{ engagementIds: [1] }, { engagementIds: [2] }]);

    expect(counts[0].high).toBe(1);
    expect(counts[1]).toEqual({ critical: 0, high: 0, medium: 0, low: 0, unassigned: SEVERITY_LISTING_LIMIT + 5 });
  });

  it("keeps at most four requests in flight", async () => {
    const client = createClient();
    let inFlight = 0;
    let peak = 0;
    vi.spyOn(client, "listFindingSeverities").mockImplementation(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return listing([]);
    });

    await countFindingRows(
      client,
      [1, 2, 3, 4, 5, 6].map((id) => ({ engagementIds: [id] }))
    );

    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
  });

  it("returns no counts for no filter", async () => {
    const client = createClient();
    const listFindingSeverities = vi.spyOn(client, "listFindingSeverities");

    expect(await countFindingRows(client, [])).toEqual([]);
    expect(listFindingSeverities).not.toHaveBeenCalled();
  });
});
