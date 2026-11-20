import { describe, expect, it, vi } from "vitest";
import {
  SEVERITY_LISTING_LIMIT,
  type DefectDojoEngagement,
  type DefectDojoTest,
} from "../../clients/defectdojo/index.js";
import { createTestClient } from "./__fixtures__/defectdojo.js";
import {
  classifyEngagement,
  countFindingRows,
  latestVersionOf,
  listCiEngagements,
  loadClassifiedEngagements,
  sortedCopy,
  sortedUnique,
  toolsOf,
  updatedOf,
  versionsOf,
} from "./engagements.js";

function engagement(id: number, name: string): DefectDojoEngagement {
  return { id, name, product: 3 };
}

function test(overrides: Partial<DefectDojoTest> = {}): DefectDojoTest {
  return { id: 1, title: "Trivy Scan", engagement: 2, tags: [], ...overrides };
}

describe("classifyEngagement", () => {
  it("recognizes a code engagement and its branch", () => {
    expect(classifyEngagement(engagement(1, "code-security-main"))).toEqual({ kind: "code", branch: "main" });
  });

  it("keeps a slash of the branch", () => {
    expect(classifyEngagement(engagement(1, "code-security-release/1.0"))).toMatchObject({ branch: "release/1.0" });
  });

  it("recognizes an image engagement and its image", () => {
    expect(classifyEngagement(engagement(1, "image:registry.example.com/team/app"))).toEqual({
      kind: "image",
      image: "registry.example.com/team/app",
    });
  });

  it.each(["trivy-operator", "scheduled scan", "manual pentest"])("ignores the engagement %s", (name) => {
    expect(classifyEngagement(engagement(1, name))).toBeUndefined();
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

describe("listCiEngagements", () => {
  it("returns the CI engagements of a product with their kind, without reading any test", async () => {
    const client = createTestClient();
    vi.spyOn(client, "listEngagements").mockResolvedValue([
      engagement(3, "code-security-main"),
      engagement(4, "scheduled scan"),
      engagement(2, "image:busybox"),
    ]);
    const tests = vi.spyOn(client, "listTestsByEngagement");

    const listed = await listCiEngagements(client, 3);

    expect(listed.map(({ engagement: e, kind }) => [e.id, kind.kind])).toEqual([
      [3, "code"],
      [2, "image"],
    ]);
    expect(client.listEngagements).toHaveBeenCalledWith(3);
    expect(tests).not.toHaveBeenCalled();
  });
});

describe("sortedCopy", () => {
  it("orders the items by the key and leaves the input as it was", () => {
    const items = [{ name: "b" }, { name: "a" }];

    expect(sortedCopy(items, (item) => item.name)).toEqual([{ name: "a" }, { name: "b" }]);
    expect(items).toEqual([{ name: "b" }, { name: "a" }]);
  });
});

describe("loadClassifiedEngagements", () => {
  function clientWithTests(engagements: DefectDojoEngagement[], tests: Record<number, DefectDojoTest[]>) {
    const client = createTestClient();
    vi.spyOn(client, "listEngagements").mockResolvedValue(engagements);
    vi.spyOn(client, "listTestsByEngagement").mockImplementation(async (id) => tests[id] ?? []);
    return client;
  }

  it("returns the CI engagements with their tests, in the order of the product", async () => {
    const client = clientWithTests(
      [engagement(3, "code-security-main"), engagement(2, "image:busybox"), engagement(5, "manual pentest")],
      {
        3: [test({ id: 30, engagement: 3 })],
        2: [test({ id: 20, engagement: 2 })],
        5: [test({ id: 50, engagement: 5 })],
      }
    );

    const loaded = await loadClassifiedEngagements(client, 3);

    expect(loaded.map(({ engagement: e, kind }) => [e.id, kind.kind])).toEqual([
      [3, "code"],
      [2, "image"],
    ]);
    expect(loaded[1].tests).toEqual([test({ id: 20, engagement: 2 })]);
  });

  it("reads the tests of the CI engagements only", async () => {
    const client = clientWithTests(
      [engagement(2, "image:busybox"), engagement(4, "scheduled scan"), engagement(5, "trivy-operator")],
      {}
    );

    await loadClassifiedEngagements(client, 3);

    expect(client.listTestsByEngagement).toHaveBeenCalledTimes(1);
    expect(client.listTestsByEngagement).toHaveBeenCalledWith(2);
  });

  it("returns nothing for a product without CI engagements", async () => {
    const client = clientWithTests([engagement(4, "scheduled scan")], {});

    expect(await loadClassifiedEngagements(client, 3)).toEqual([]);
  });
});

describe("countFindingRows", () => {
  const listing = (severities: string[], count = severities.length) => ({ count, severities });

  it("counts the severities of a filter at the listing limit from its rows", async () => {
    const client = createTestClient();
    const severities = [...Array<string>(SEVERITY_LISTING_LIMIT - 4).fill("Low"), "Critical", "High", "Medium", "Info"];
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing(severities));
    const countFindings = vi.spyOn(client, "countFindings");

    const [counts] = await countFindingRows(client, [{ engagementIds: [1] }]);

    expect(counts).toEqual({ critical: 1, high: 1, medium: 1, low: SEVERITY_LISTING_LIMIT - 4, unassigned: 1 });
    expect(countFindings).not.toHaveBeenCalled();
  });

  it("reads severities of unknown names as unassigned", async () => {
    const client = createTestClient();
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing(["Unknown"]));

    const [counts] = await countFindingRows(client, [{ engagementIds: [1] }]);

    expect(counts.unassigned).toBe(1);
  });

  it("counts a filter without findings as zero", async () => {
    const client = createTestClient();
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing([]));

    expect(await countFindingRows(client, [{ engagementIds: [1] }])).toEqual([
      { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 },
    ]);
  });

  it("counts a filter above the listing limit per severity, with the remainder unassigned", async () => {
    const client = createTestClient();
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing([], SEVERITY_LISTING_LIMIT + 11));
    const perSeverity = { critical: 1, high: 2, medium: 3, low: 4, unassigned: 99 };
    const countFindings = vi
      .spyOn(client, "countFindings")
      .mockImplementation(async ({ severities }) => perSeverity[severities?.[0] ?? "unassigned"]);

    const [counts] = await countFindingRows(client, [{ engagementIds: [1, 2], anyTestTags: ["oci-image:nginx"] }]);

    expect(counts).toEqual({ critical: 1, high: 2, medium: 3, low: 4, unassigned: SEVERITY_LISTING_LIMIT + 1 });
    expect(countFindings).toHaveBeenCalledTimes(4);
    expect(countFindings).toHaveBeenCalledWith({
      engagementIds: [1, 2],
      anyTestTags: ["oci-image:nginx"],
      severities: ["critical"],
    });
    expect(countFindings).not.toHaveBeenCalledWith(expect.objectContaining({ severities: ["unassigned"] }));
  });

  it("clamps the unassigned remainder at zero", async () => {
    const client = createTestClient();
    vi.spyOn(client, "listFindingSeverities").mockResolvedValue(listing([], SEVERITY_LISTING_LIMIT + 1));
    vi.spyOn(client, "countFindings").mockResolvedValue(SEVERITY_LISTING_LIMIT);

    const [counts] = await countFindingRows(client, [{ engagementIds: [1] }]);

    expect(counts.unassigned).toBe(0);
  });

  it("mixes listed and counted filters, keeping the order of the filters", async () => {
    const client = createTestClient();
    vi.spyOn(client, "listFindingSeverities").mockImplementation(async ({ engagementIds }) =>
      engagementIds[0] === 1 ? listing(["High"]) : listing([], SEVERITY_LISTING_LIMIT + 5)
    );
    vi.spyOn(client, "countFindings").mockResolvedValue(0);

    const counts = await countFindingRows(client, [{ engagementIds: [1] }, { engagementIds: [2] }]);

    expect(counts[0].high).toBe(1);
    expect(counts[1]).toEqual({ critical: 0, high: 0, medium: 0, low: 0, unassigned: SEVERITY_LISTING_LIMIT + 5 });
  });

  it("keeps at most four requests in flight", async () => {
    const client = createTestClient();
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
    const client = createTestClient();
    const listFindingSeverities = vi.spyOn(client, "listFindingSeverities");

    expect(await countFindingRows(client, [])).toEqual([]);
    expect(listFindingSeverities).not.toHaveBeenCalled();
  });
});
