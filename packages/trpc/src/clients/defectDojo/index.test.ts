/**
 * The client against recorded DefectDojo answers: a local HTTP server answers with the answers recorded from the
 * testbed (`__fixtures__/answers.json`, written by `scripts/record-defectdojo-fixtures.ts`). The expected values
 * below are written out by hand from those answers.
 */
import http from "node:http";
import net, { type AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  recordedAnswer,
  REPLAY_TOKEN,
  REPLAY_WEB_URL,
  startReplayServer,
  type ReplayServer,
} from "./__fixtures__/replay.js";
import { requestKeyOf } from "./__fixtures__/answers.js";
import { findingsRequest } from "./requests.js";
import {
  FINDINGS_MAX_PAGE_SIZE,
  createDefectDojoClient,
  DefectDojoClient,
  resetIdCaches,
  type DefectDojoClientConfig,
  type DefectDojoFindingsPage,
  type DefectDojoResult,
  type DefectDojoScanType,
  type DefectDojoTest,
} from "./index.js";

let server: ReplayServer;
const stubs: http.Server[] = [];

beforeEach(async () => {
  resetIdCaches();
  server = await startReplayServer();
});

afterEach(async () => {
  await server.close();
  await Promise.all(
    stubs.splice(0).map(
      (stub) =>
        new Promise<void>((resolve) => {
          stub.closeAllConnections();
          stub.close(() => resolve());
        })
    )
  );
  expect(server.unrecorded, "requests without a recorded answer").toEqual([]);
});

/** A server of its own, for the answers that the replay server does not hold. Returns its address. */
async function startStub(handler: http.RequestListener): Promise<string> {
  const stub = http.createServer(handler);
  stubs.push(stub);
  await new Promise<void>((resolve) => stub.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(stub.address() as AddressInfo).port}`;
}

function createClient(overrides: Partial<DefectDojoClientConfig> = {}): DefectDojoClient {
  return new DefectDojoClient({
    apiBaseURL: server.url,
    token: REPLAY_TOKEN,
    webBaseURL: REPLAY_WEB_URL,
    ...overrides,
  });
}

const GO_CODEBASE_TAGS = ["app.edp.epam.com/codebase:test-go-app", "app.edp.epam.com/tenant:krci"];

describe("the settings of a client", () => {
  it("link to the address the client reads and read the Product Type KubeRocketCI when nothing else is set", async () => {
    const client = new DefectDojoClient({ apiBaseURL: `${server.url}/`, token: REPLAY_TOKEN });

    const result = await client.listProducts(["app.edp.epam.com/tenant:other"]);

    expect(result.state === "data" && result.data[0]?.url).toBe(`${server.url}/asset/6`);
  });

  it("come from the environment, with the web URL and the Product Type of their own", async () => {
    const client = createDefectDojoClient({
      DEFECTDOJO_URL: server.url,
      DEFECTDOJO_TOKEN: REPLAY_TOKEN,
      DEFECTDOJO_WEB_URL: "https://dd.example.com/",
    });

    const result = await client.listProducts(["app.edp.epam.com/tenant:other"]);
    const otherProductType = await createDefectDojoClient({
      DEFECTDOJO_URL: server.url,
      DEFECTDOJO_TOKEN: REPLAY_TOKEN,
      DEFECTDOJO_PRODUCT_TYPE: "Platform",
    }).listProducts(["app.edp.epam.com/tenant:other"]);

    expect(result.state === "data" && result.data[0]?.url).toBe("https://dd.example.com/asset/6");
    expect(otherProductType).toEqual({ state: "noScanData" });
  });

  it("are missing from an environment without the URL or the token: the client answers notConfigured", async () => {
    const client = createDefectDojoClient({ DEFECTDOJO_URL: server.url });

    expect(await client.listProducts(["app.edp.epam.com/tenant:krci"])).toEqual({ state: "notConfigured" });
    expect(server.requests).toEqual([]);
  });
});

describe("a client that is not configured", () => {
  const calls: [string, (client: DefectDojoClient) => Promise<unknown>][] = [
    ["listProducts", (client) => client.listProducts(["app.edp.epam.com/tenant:krci"])],
    ["listTests", (client) => client.listTests({ tags: GO_CODEBASE_TAGS })],
    ["getSeverityCounts", (client) => client.getSeverityCounts({ testId: 41 })],
    ["listFindings", (client) => client.listFindings({ scope: { testId: 41 } })],
  ];

  it.each([
    ["no URL", { apiBaseURL: "" }],
    ["no token", { token: "" }],
  ])("with %s answers notConfigured to every call and sends no request", async (_, overrides) => {
    const client = createClient(overrides);

    for (const [, call] of calls) {
      expect(await call(client)).toEqual({ state: "notConfigured" });
    }
    expect(server.requests).toEqual([]);
  });
});

describe("listProducts", () => {
  it("finds the namespace product of an Environment by its cluster and namespace tags", async () => {
    const result = await createClient().listProducts(["k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev"]);

    expect(result).toEqual({
      state: "data",
      data: [
        {
          id: 4,
          name: "in-cluster/krci-demo-dev",
          tags: ["app.edp.epam.com/tenant:krci", "k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev"],
          url: "https://defectdojo.example.test/asset/4",
        },
      ],
    });
  });

  it("lists the namespaces the installation manages by the tenant tag", async () => {
    const managed = await createClient().listProducts(["app.edp.epam.com/tenant:krci"]);
    const other = await createClient().listProducts(["app.edp.epam.com/tenant:other"]);

    expect(managed).toMatchObject({ state: "data" });
    expect(managed.state === "data" && managed.data.map((product) => product.name)).toEqual([
      "in-cluster/krci-demo-dev",
      "in-cluster/krci-demo-qa",
    ]);
    expect(other.state === "data" && other.data.map((product) => product.name)).toEqual(["in-cluster/krci-other-dev"]);
  });

  it("lower-cases the tags before it filters", async () => {
    const result = await createClient().listProducts(["K8S-Cluster:In-Cluster", "k8s-namespace:KRCI-DEMO-DEV"]);

    expect(result.state === "data" && result.data.map((product) => product.id)).toEqual([4]);
  });

  it("answers noScanData when no product carries the tags", async () => {
    const result = await createClient().listProducts(["k8s-cluster:remote-cluster", "k8s-namespace:krci-demo-prod"]);

    expect(result).toEqual({ state: "noScanData" });
  });

  it("answers noScanData to a Product Type that holds none of the products", async () => {
    const result = await createClient({ productType: "Platform" }).listProducts(["app.edp.epam.com/tenant:krci"]);

    expect(result).toEqual({ state: "noScanData" });
  });

  it.each([
    ["no tag", []],
    ["an empty tag", [""]],
    ["a tag with a comma", ["k8s-cluster:in-cluster,k8s-namespace:krci-demo-dev"]],
    ["a tag with a space", ["k8s-namespace:krci demo dev"]],
  ])("answers noScanData to %s without a request: no stored tag matches", async (_, tags) => {
    const result = await createClient().listProducts(tags);

    expect(result).toEqual({ state: "noScanData" });
    expect(server.requests).toEqual([]);
  });

  it("asks for the products in a fixed order, so that pages do not overlap", async () => {
    await createClient().listProducts(["app.edp.epam.com/tenant:krci"]);

    expect(server.requests[0]?.key).toContain("o=id");
  });

  it("builds the links from the web URL, not from the address it reads", async () => {
    const result = await createClient({ webBaseURL: "https://dd.example.com/prefix" }).listProducts([
      "app.edp.epam.com/tenant:other",
    ]);

    expect(result.state === "data" && result.data[0]?.url).toBe("https://dd.example.com/prefix/asset/6");
  });
});

/** Ids of the tests of a result, in the order of the answer. */
function testIds(result: DefectDojoResult<DefectDojoTest[]>): number[] {
  return result.state === "data" ? result.data.map((test) => test.id) : [];
}

describe("listProductsWithTagText", () => {
  it("lists the namespace products of every cluster by the text of their cluster tag", async () => {
    const result = await createClient().listProductsWithTagText("k8s-cluster:");

    expect(result.state === "data" && result.data.map((product) => product.name)).toEqual([
      "in-cluster/argocd",
      "in-cluster/krci",
      "in-cluster/krci-security",
      "in-cluster/krci-demo-dev",
      "in-cluster/krci-demo-qa",
      "in-cluster/krci-other-dev",
    ]);
    expect(result.state === "data" && result.data[0]).toEqual({
      id: 1,
      name: "in-cluster/argocd",
      tags: ["k8s-cluster:in-cluster", "k8s-namespace:argocd"],
      url: "https://defectdojo.example.test/asset/1",
    });
  });

  it("answers noScanData to a Product Type that holds none of the products", async () => {
    const result = await createClient({ productType: "Platform" }).listProductsWithTagText("k8s-cluster:");

    expect(result).toEqual({ state: "noScanData" });
  });

  it("answers noScanData to an empty text, without a request: every product would match", async () => {
    const result = await createClient().listProductsWithTagText("");

    expect(result).toEqual({ state: "noScanData" });
    expect(server.requests).toEqual([]);
  });
});

describe("listTests", () => {
  describe("the CI tests of a codebase, by its codebase and tenant tags", () => {
    it("returns every scan of the codebase with its level, branch, commit and place in DefectDojo", async () => {
      const result = await createClient().listTests({ tags: GO_CODEBASE_TAGS });

      expect(testIds(result)).toEqual([41, 48, 49, 50, 51, 52]);
      expect(result.state === "data" && result.data.find((test) => test.id === 48)).toEqual({
        id: 48,
        title: "Semgrep JSON Report",
        scanType: "Semgrep JSON Report",
        level: "code",
        branchTag: "main",
        commitHash: "3f2a9c1d4e5b6a7788990011223344556677aabb",
        version: "",
        buildId: "",
        closed: false,
        tags: ["app.edp.epam.com/codebase:test-go-app", "app.edp.epam.com/tenant:krci"],
        created: "2026-11-23T10:09:05.627599Z",
        updated: "2026-11-23T10:09:17.193799Z",
        url: "https://defectdojo.example.test/test/48",
        engagement: {
          id: 13,
          name: "code-security-main",
          url: "https://defectdojo.example.test/engagement/13",
        },
        product: { id: 7, name: "test-go-app", url: "https://defectdojo.example.test/asset/7" },
      });
    });

    it("finds the tests of a second codebase", async () => {
      const result = await createClient().listTests({
        tags: ["app.edp.epam.com/codebase:krci-gitops", "app.edp.epam.com/tenant:krci"],
      });

      expect(testIds(result)).toEqual([53, 54, 55]);
    });

    it("answers noScanData to a codebase that has no scan", async () => {
      const result = await createClient().listTests({
        tags: ["app.edp.epam.com/codebase:no-such-app", "app.edp.epam.com/tenant:krci"],
      });

      expect(result).toEqual({ state: "noScanData" });
    });

    it("lower-cases the tags before it filters", async () => {
      const result = await createClient().listTests({
        tags: ["APP.EDP.EPAM.COM/CODEBASE:Test-Go-App", "app.edp.epam.com/tenant:KRCI"],
      });

      expect(testIds(result)).toEqual([41, 48, 49, 50, 51, 52]);
    });

    it("reads a list longer than one page page by page", async () => {
      const result = await createClient({ listPageSize: 2 }).listTests({ tags: GO_CODEBASE_TAGS });

      expect(testIds(result)).toEqual([41, 48, 49, 50, 51, 52]);
      expect(server.requests).toHaveLength(3);
    });

    it("asks for the tests in a fixed order, so that pages do not overlap", async () => {
      await createClient().listTests({ tags: GO_CODEBASE_TAGS });

      expect(server.requests[0]?.key).toContain("o=created");
    });

    it("keeps a test once when two pages both hold it", async () => {
      const [first, second, third] = [0, 2, 4].map(
        (offset) =>
          recordedAnswer(
            `GET /api/v2/tests/?limit=2&o=created&offset=${offset}&prefetch=engagement&tags__and=app.edp.epam.com%2Fcodebase%3Atest-go-app%2Capp.edp.epam.com%2Ftenant%3Akrci`
          ).body as { results: unknown[] }
      );
      // A row of the first page is created or moved while the list is read: the second page starts with it again.
      const pagesByOffset: Record<string, unknown> = {
        "0": first,
        "2": { ...second, results: [first.results[1], second.results[0]] },
        "4": third,
      };
      const overlapping = await startStub((request, response) => {
        const offset = new URL(request.url ?? "", "http://stub.invalid").searchParams.get("offset") ?? "";
        response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(pagesByOffset[offset]));
      });

      const result = await createClient({ apiBaseURL: overlapping, listPageSize: 2 }).listTests({
        tags: GO_CODEBASE_TAGS,
      });

      expect(testIds(result)).toEqual([41, 48, 49, 51, 52]);
    });
  });

  describe("the level of a test, by its scan type", () => {
    it("is code for Semgrep and Gitleaks, image for Trivy Scan and Anchore Grype, runtime for Trivy Operator Scan", async () => {
      const ci = await createClient().listTests({ tags: GO_CODEBASE_TAGS });
      const runtime = await createClient().listTests({
        tags: ["k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev", "app:demo-dev-test-go-app"],
      });

      const levels = (result: DefectDojoResult<DefectDojoTest[]>) =>
        result.state === "data" ? result.data.map((test) => [test.scanType, test.level]) : [];
      expect(levels(ci)).toEqual([
        ["Trivy Scan", "image"],
        ["Semgrep JSON Report", "code"],
        ["Gitleaks Scan", "code"],
        ["Anchore Grype", "image"],
        ["Trivy Scan", "image"],
        ["Semgrep JSON Report", "code"],
      ]);
      expect(levels(runtime)).toEqual([["Trivy Operator Scan", "runtime"]]);
    });

    it("selects the tests of one scan type", async () => {
      const result = await createClient().listTests({ tags: GO_CODEBASE_TAGS, scanType: "Trivy Scan" });

      expect(testIds(result)).toEqual([41, 51]);
    });
  });

  it("selects the tests of a branch by the branch tag of the test", async () => {
    const result = await createClient().listTests({ tags: GO_CODEBASE_TAGS, branchTag: "feature-login" });

    expect(testIds(result)).toEqual([52]);
    expect(result.state === "data" && result.data[0]?.commitHash).toBe("9b8c7d6e5f40312213243546576879808a9bacbd");
  });

  it.each([
    ["an empty branch tag", { branchTag: "" }],
    ["an empty scan type", { scanType: "" as DefectDojoScanType }],
  ])(
    "answers noScanData to %s without a request: it must not match the tests of every branch or scan type",
    async (_, filter) => {
      const result = await createClient().listTests({ tags: GO_CODEBASE_TAGS, ...filter });

      expect(result).toEqual({ state: "noScanData" });
      expect(server.requests).toEqual([]);
    }
  );

  it("tells the own image of a codebase from a third-party image of its chart by the oci-image tag", async () => {
    const own = await createClient().listTests({
      tags: [...GO_CODEBASE_TAGS, "oci-image:gitlab.127.0.0.1.nip.io:5050/krci/test-go-app"],
    });

    expect(testIds(own)).toEqual([41, 50]);
    expect(own.state === "data" && own.data.map((test) => test.engagement.name)).toEqual([
      "image:gitlab.127.0.0.1.nip.io:5050/krci/test-go-app",
      "image:gitlab.127.0.0.1.nip.io:5050/krci/test-go-app",
    ]);
  });

  describe("runtime tests", () => {
    it("finds the tests of a codebase in an Environment by the cluster, namespace and application tags", async () => {
      const result = await createClient().listTests({
        tags: ["k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev", "app:demo-dev-test-go-app"],
      });

      expect(result.state === "data" && result.data).toMatchObject([
        {
          id: 34,
          title: "VulnerabilityReport deployment/test-go-app/test-go-app",
          level: "runtime",
          closed: false,
          product: { id: 4, name: "in-cluster/krci-demo-dev" },
        },
      ]);
    });

    it("finds the tests of a workload container by the workload and container tags", async () => {
      const result = await createClient().listTests({
        tags: [
          "k8s-cluster:in-cluster",
          "k8s-namespace:krci-demo-dev",
          "k8s-workload:deployment.web",
          "k8s-container:istio-proxy",
        ],
      });

      expect(testIds(result)).toEqual([38]);
    });

    it("tells the vulnerability reports from the exposed secret reports by the report-kind tag", async () => {
      const namespace = ["k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev"];

      const vulnerabilities = await createClient().listTests({
        tags: [...namespace, "report-kind:vulnerabilityreport"],
      });
      const secrets = await createClient().listTests({ tags: [...namespace, "report-kind:exposedsecretreport"] });

      expect(testIds(vulnerabilities)).toEqual([34, 37, 38, 39, 40]);
      expect(testIds(secrets)).toEqual([33]);
    });

    it("marks a runtime test without a build id as closed", async () => {
      const result = await createClient().listTests({
        tags: ["k8s-cluster:remote-cluster", "k8s-namespace:krci-demo-prod"],
      });

      expect(result.state === "data" && result.data).toMatchObject([
        { id: 42, level: "runtime", buildId: "", closed: true },
      ]);
    });

    it("does not mark a CI test as closed for lack of a build id", async () => {
      const result = await createClient().listTests({ tags: GO_CODEBASE_TAGS });

      expect(result.state === "data" && result.data.some((test) => test.closed)).toBe(false);
    });
  });

  it("finds the tests that carry one of several tags: the vulnerability reports of the clusters of the Stages", async () => {
    const result = await createClient().listTests({
      tags: ["report-kind:vulnerabilityreport"],
      anyTags: ["k8s-cluster:in-cluster", "k8s-cluster:remote-cluster"],
    });

    expect(result.state === "data" && result.data).toHaveLength(23);
    expect(result.state === "data" && result.data.find((test) => test.id === 65)?.tags).toContain(
      "k8s-cluster:remote-cluster"
    );
    expect(result.state === "data" && result.data.find((test) => test.id === 63)).toMatchObject({ closed: true });
  });

  it("answers noScanData to a Product Type that holds none of the tests", async () => {
    const result = await createClient({ productType: "Platform" }).listTests({ tags: GO_CODEBASE_TAGS });

    expect(result).toEqual({ state: "noScanData" });
  });

  it("answers noScanData to tags that no stored tag matches, without a request", async () => {
    const result = await createClient().listTests({ tags: ["app.edp.epam.com/codebase:a,b"] });
    const anyTags = await createClient().listTests({ tags: GO_CODEBASE_TAGS, anyTags: ["k8s-cluster:a b"] });

    expect(result).toEqual({ state: "noScanData" });
    expect(anyTags).toEqual({ state: "noScanData" });
    expect(server.requests).toEqual([]);
  });
});

describe("hasTests", () => {
  const RUNTIME_VULNERABILITY_TESTS = { tags: ["report-kind:vulnerabilityreport"] };

  it("says a test of the Product Type carries the tags", async () => {
    const result = await createClient().hasTests({
      ...RUNTIME_VULNERABILITY_TESTS,
      anyTags: ["k8s-cluster:in-cluster", "k8s-cluster:remote-cluster"],
    });

    expect(result).toEqual({ state: "data", data: true });
  });

  it("says no test carries them for a cluster without tests", async () => {
    const result = await createClient().hasTests({
      ...RUNTIME_VULNERABILITY_TESTS,
      anyTags: ["k8s-cluster:no-such-cluster"],
    });

    expect(result).toEqual({ state: "data", data: false });
  });

  it("does not count the tests of another Product Type: the tests list has no filter for it", async () => {
    const result = await createClient({ productType: "Platform" }).hasTests({
      ...RUNTIME_VULNERABILITY_TESTS,
      anyTags: ["k8s-cluster:in-cluster", "k8s-cluster:remote-cluster"],
    });

    expect(result).toEqual({ state: "data", data: false });
  });

  it("says no test carries tags that no stored tag matches, without a request", async () => {
    const result = await createClient().hasTests({ tags: ["report-kind:a,b"] });

    expect(result).toEqual({ state: "data", data: false });
    expect(server.requests).toEqual([]);
  });
});

describe("getSeverityCounts", () => {
  it("counts the active findings of a set of products in one request", async () => {
    const result = await createClient().getSeverityCounts({ productIds: [4, 5] });

    expect(result).toEqual({
      state: "data",
      data: { total: 20, active: 20, severity: { Critical: 5, High: 6, Medium: 7, Low: 2, Info: 0 } },
    });
    expect(server.requests).toHaveLength(1);
  });

  it("counts the findings of one product", async () => {
    const result = await createClient().getSeverityCounts({ productIds: [11] });

    expect(result).toEqual({
      state: "data",
      data: { total: 2, active: 2, severity: { Critical: 0, High: 1, Medium: 0, Low: 1, Info: 0 } },
    });
  });

  it("counts the active findings of one test", async () => {
    const result = await createClient().getSeverityCounts({ testId: 41 });

    expect(result).toEqual({
      state: "data",
      data: { total: 4, active: 4, severity: { Critical: 1, High: 2, Medium: 1, Low: 0, Info: 0 } },
    });
    expect(server.requests).toHaveLength(1);
  });

  it("counts the findings of every state when it is asked to: the mitigated ones stay out of `active`", async () => {
    const result = await createClient().getSeverityCounts({ testId: 41 }, { activeOnly: false });

    expect(result).toEqual({
      state: "data",
      data: { total: 9, active: 4, severity: { Critical: 3, High: 4, Medium: 1, Low: 1, Info: 0 } },
    });
  });

  it("counts a clean scan as zero findings, not as no scan data", async () => {
    const result = await createClient().getSeverityCounts({ testId: 53 });

    expect(result).toEqual({
      state: "data",
      data: { total: 0, active: 0, severity: { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 } },
    });
  });

  it("answers noScanData to an empty set of products, without a request", async () => {
    const result = await createClient().getSeverityCounts({ productIds: [] });

    expect(result).toEqual({ state: "noScanData" });
    expect(server.requests).toEqual([]);
  });

  it("answers noScanData to a test that does not exist: DefectDojo counts zero for it, so the test is looked up", async () => {
    const result = await createClient().getSeverityCounts({ testId: 99999 });

    expect(result).toEqual({ state: "noScanData" });
  });

  it("asks for no duplicates", async () => {
    await createClient().getSeverityCounts({ testId: 41 });

    expect(server.requests[0]?.key).toContain("duplicate=false");
  });

  it("looks a test up only when it has no finding", async () => {
    await createClient().getSeverityCounts({ testId: 41 });
    expect(server.requests).toHaveLength(1);

    await createClient().getSeverityCounts({ testId: 53 });
    expect(server.requests.map(({ key }) => key.split("?")[0])).toEqual([
      "GET /api/v3/findings",
      "GET /api/v3/findings",
      "GET /api/v2/tests/53/",
    ]);
  });

  it("does not look a test up when the caller knows it exists: a test of a list is counted zero as it is", async () => {
    const result = await createClient().getSeverityCounts({ testId: 53 }, { testExists: true });

    expect(result).toEqual({
      state: "data",
      data: { total: 0, active: 0, severity: { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 } },
    });
    expect(server.requests.map(({ key }) => key.split("?")[0])).toEqual(["GET /api/v3/findings"]);
  });
});

/** Ids of the findings of a result, in the order of the answer. */
function findingIds(result: DefectDojoResult<DefectDojoFindingsPage>): number[] {
  return result.state === "data" ? result.data.findings.map((finding) => finding.id) : [];
}

describe("listFindings", () => {
  describe("the fields of a finding", () => {
    it("returns a vulnerability with its component, vulnerability id, fix and place in DefectDojo", async () => {
      const result = await createClient().listFindings({ scope: { testId: 41 } });

      expect(result.state === "data" && result.data.findings[0]).toEqual({
        id: 1030,
        title: "CVE-2099-1001 Openssl 3.3.1-r0",
        severity: "Critical",
        active: true,
        verified: false,
        duplicate: false,
        falsePositive: false,
        outOfScope: false,
        riskAccepted: false,
        mitigated: false,
        underReview: false,
        date: "2026-11-23",
        created: "2026-11-23T10:09:06.086820Z",
        updated: "2026-11-23T10:09:06.086837Z",
        mitigatedAt: null,
        componentName: "openssl",
        componentVersion: "3.3.1-r0",
        vulnerabilityIds: ["CVE-2099-1001"],
        filePath: "gitlab.127.0.0.1.nip.io:5050/krci/test-go-app:main-20261123-090000 (alpine 3.20.3)",
        line: null,
        service: null,
        fixAvailable: true,
        fixVersion: null,
        url: "https://defectdojo.example.test/finding/1030",
        test: { id: 41, url: "https://defectdojo.example.test/test/41" },
        engagement: { id: 7, url: "https://defectdojo.example.test/engagement/7" },
        product: { id: 7, url: "https://defectdojo.example.test/asset/7" },
      });
    });

    it("orders the findings by severity and reports how many the filter holds", async () => {
      const result = await createClient().listFindings({ scope: { testId: 41 } });

      expect(result.state === "data" && result.data.total).toBe(4);
      expect(result.state === "data" && result.data.findings.map((finding) => finding.severity)).toEqual([
        "Critical",
        "High",
        "High",
        "Medium",
      ]);
    });
  });

  describe("secret findings", () => {
    const SECRET = "fixture-secret-value-0001";

    it("keeps the description and the mitigation of a Gitleaks finding on the server", async () => {
      const answer = recordedAnswer(
        requestKeyOf(
          findingsRequest({
            scope: { testId: 49 },
            state: "active",
            severities: [],
            testTypeIds: [],
            limit: FINDINGS_MAX_PAGE_SIZE,
            offset: 0,
          })
        )
      );
      const [recorded] = (answer.body as { results: { description: string; mitigation: string }[] }).results;
      expect(recorded.description).toContain(SECRET);
      expect(recorded.mitigation).toBeTruthy();

      const result = await createClient().listFindings({ scope: { testId: 49 } });

      expect(result.state === "data" && result.data.findings[0]).toEqual({
        id: 1026,
        title: "Hard Coded Generic API Key Found in config/app.env",
        severity: "High",
        active: true,
        verified: false,
        duplicate: false,
        falsePositive: false,
        outOfScope: false,
        riskAccepted: false,
        mitigated: false,
        underReview: false,
        date: "2026-11-23",
        created: "2026-11-23T10:09:05.878081Z",
        updated: "2026-11-23T10:09:59.276785Z",
        mitigatedAt: null,
        componentName: null,
        componentVersion: null,
        vulnerabilityIds: [],
        filePath: "config/app.env",
        line: 3,
        service: null,
        fixAvailable: null,
        fixVersion: null,
        url: "https://defectdojo.example.test/finding/1026",
        test: { id: 49, url: "https://defectdojo.example.test/test/49" },
        engagement: { id: 13, url: "https://defectdojo.example.test/engagement/13" },
        product: { id: 7, url: "https://defectdojo.example.test/asset/7" },
      });
      expect(JSON.stringify(result)).not.toContain(SECRET);
    });

    it("returns no description and no mitigation of a finding of a runtime exposed secret report", async () => {
      const result = await createClient().listFindings({ scope: { testId: 33 } });

      expect(result.state === "data" && result.data.findings).toHaveLength(1);
      const finding = result.state === "data" ? result.data.findings[0] : null;
      expect(finding).toMatchObject({
        id: 872,
        filePath: "/app/fixture-0.env",
        service: "krci-demo-dev/Deployment/web/web",
      });
      expect(finding).not.toHaveProperty("description");
      expect(finding).not.toHaveProperty("mitigation");
    });
  });

  describe("the scope", () => {
    it("lists the findings of a product", async () => {
      const result = await createClient().listFindings({ scope: { productIds: [11] } });

      expect(findingIds(result)).toEqual([1040, 1041]);
    });

    it("lists the secrets of a product by the Gitleaks scan type, looking the test type up once", async () => {
      const client = createClient();

      const first = await client.listFindings({ scope: { productIds: [7] }, scanTypes: ["Gitleaks Scan"] });
      const second = await client.listFindings({ scope: { productIds: [7] }, scanTypes: ["Gitleaks Scan"] });

      expect(findingIds(first)).toEqual([1026, 1027]);
      expect(findingIds(second)).toEqual([1026, 1027]);
      expect(server.requests.filter(({ key }) => key.includes("/api/v2/test_types/"))).toHaveLength(1);
    });

    it("lists the findings of several scan types together", async () => {
      const result = await createClient().listFindings({
        scope: { productIds: [11] },
        scanTypes: ["Gitleaks Scan", "Trivy Scan"],
      });

      expect(findingIds(result)).toEqual([1040, 1041]);
    });

    it("answers noScanData to a scan type that has no test type: no test of it was ever imported", async () => {
      const result = await createClient().listFindings({
        scope: { productIds: [7] },
        scanTypes: ["No Such Scan" as DefectDojoScanType],
      });

      expect(result).toEqual({ state: "noScanData" });
    });

    it("answers noScanData to a test that does not exist", async () => {
      const result = await createClient().listFindings({ scope: { testId: 99999 } });

      expect(result).toEqual({ state: "noScanData" });
    });

    it("answers noScanData to an empty set of products, without a request", async () => {
      const result = await createClient().listFindings({ scope: { productIds: [] } });

      expect(result).toEqual({ state: "noScanData" });
      expect(server.requests).toEqual([]);
    });
  });

  describe("the findings of the tests that carry tags", () => {
    const VULNERABILITY_REPORTS = ["report-kind:vulnerabilityreport"];
    const BED_CLUSTERS = ["k8s-cluster:in-cluster", "k8s-cluster:remote-cluster"];

    it("lists the runtime findings of several clusters, most severe first, each test of the page with its tags", async () => {
      const result = await createClient().listFindings({
        scope: { testTags: { all: VULNERABILITY_REPORTS, any: BED_CLUSTERS } },
        withTests: true,
        limit: 5,
      });

      expect(result.state === "data" && result.data.total).toBe(896);
      expect(findingIds(result)).toEqual([71, 132, 163, 281, 329]);
      expect(result.state === "data" && result.data.tests.map((test) => test.id)).toEqual([3, 19]);
      expect(result.state === "data" && result.data.tests[0]).toEqual({
        id: 3,
        title: "VulnerabilityReport statefulset/argocd-application-controller/application-controller",
        scanType: "Trivy Operator Scan",
        level: "runtime",
        branchTag: "",
        commitHash: "",
        version: "v3.5.3",
        buildId: expect.stringMatching(/.+/),
        closed: false,
        tags: [
          "app:argocd",
          "app.kubernetes.io/name:argocd-application-controller",
          "k8s-cluster:in-cluster",
          "k8s-container:application-controller",
          "k8s-namespace:argocd",
          "k8s-workload:statefulset.argocd-application-controller",
          "oci-image:quay.io/argoproj/argocd",
          "report-kind:vulnerabilityreport",
        ],
        created: expect.any(String),
        updated: expect.any(String),
        url: "https://defectdojo.example.test/test/3",
      });
    });

    it("asks for the findings in a total order, so that pages of equal severity do not overlap", async () => {
      await createClient().listFindings({ scope: { testId: 41 } });

      expect(server.requests.map((request) => request.key)).toEqual([
        expect.stringContaining("o=numerical_severity%2Cid"),
      ]);
    });

    it("keeps to the Product Type, by its id, looked up once", async () => {
      const client = createClient();

      await client.listFindings({
        scope: { testTags: { all: VULNERABILITY_REPORTS, any: BED_CLUSTERS } },
        withTests: true,
        limit: 5,
      });
      await client.listFindings({
        scope: { testTags: { all: VULNERABILITY_REPORTS, any: BED_CLUSTERS } },
        withTests: true,
        limit: 5,
      });

      const keys = server.requests.map((request) => request.key);
      expect(keys.filter((key) => key.startsWith("GET /api/v2/product_types/"))).toEqual([
        "GET /api/v2/product_types/?name=KubeRocketCI",
      ]);
      expect(
        keys.filter((key) => key.startsWith("GET /api/v2/findings/")).every((key) => key.includes("prod_type=2"))
      ).toBe(true);
    });

    it("answers noScanData when DefectDojo has no Product Type of the configured name, without a findings request", async () => {
      const result = await createClient({ productType: "No Such Type" }).listFindings({
        scope: { testTags: { all: VULNERABILITY_REPORTS, any: BED_CLUSTERS } },
      });

      expect(result).toEqual({ state: "noScanData" });
      expect(server.requests.map((request) => request.key)).toEqual(["GET /api/v2/product_types/?name=No+Such+Type"]);
    });

    it("scopes the runtime findings to one namespace of a cluster", async () => {
      const result = await createClient().listFindings({
        scope: {
          testTags: { all: [...VULNERABILITY_REPORTS, "k8s-namespace:krci-demo-dev"], any: ["k8s-cluster:in-cluster"] },
        },
        withTests: true,
        limit: 5,
      });

      expect(result.state === "data" && result.data.total).toBe(17);
      expect(findingIds(result)).toEqual([873, 903, 906, 924, 874]);
      expect(result.state === "data" && result.data.tests.map((test) => test.id)).toEqual([34, 37, 39]);
    });

    it("marks the test of a workload that is gone as closed: its findings are mitigated", async () => {
      const result = await createClient().listFindings({
        scope: {
          testTags: {
            all: [...VULNERABILITY_REPORTS, "k8s-namespace:krci-demo-dev", "k8s-workload:deployment.worker"],
          },
        },
        withTests: true,
        state: "any",
        limit: 5,
      });

      expect(findingIds(result)).toEqual([1126, 1127]);
      expect(result.state === "data" && result.data.findings.every((finding) => finding.mitigated)).toBe(true);
      expect(result.state === "data" && result.data.tests).toMatchObject([{ id: 63, buildId: "", closed: true }]);
    });

    it("lists the runtime false positives, which DefectDojo marks mitigated as well", async () => {
      const result = await createClient().listFindings({
        scope: { testTags: { all: VULNERABILITY_REPORTS, any: BED_CLUSTERS } },
        withTests: true,
        state: "falsePositive",
        limit: 5,
      });

      expect(result.state === "data" && result.data.findings).toMatchObject([
        { id: 553, falsePositive: true, mitigated: true, active: false },
      ]);
      expect(result.state === "data" && result.data.tests.map((test) => test.id)).toEqual([25]);
    });

    it("lists the image findings of the tenant by the test types of both image scanners", async () => {
      const result = await createClient().listFindings({
        scope: { testTags: { all: ["app.edp.epam.com/tenant:krci"] } },
        scanTypes: ["Trivy Scan", "Anchore Grype"],
        withTests: true,
        limit: 5,
      });

      expect(result.state === "data" && result.data.total).toBe(51);
      expect(findingIds(result)).toEqual([1030, 1033, 1028, 1031, 1034]);
      expect(result.state === "data" && result.data.tests).toMatchObject([
        {
          id: 41,
          scanType: "Trivy Scan",
          level: "image",
          branchTag: "main",
          version: "main-20261123-090000",
          closed: false,
        },
        { id: 50, scanType: "Anchore Grype", level: "image", branchTag: "main", closed: false },
      ]);
    });

    it("lists the code findings of one codebase on each of its branches", async () => {
      const result = await createClient().listFindings({
        scope: { testTags: { all: GO_CODEBASE_TAGS } },
        scanTypes: ["Semgrep JSON Report"],
        withTests: true,
        limit: 5,
      });

      expect(findingIds(result)).toEqual([1024, 1039, 1025]);
      expect(result.state === "data" && result.data.tests.map((test) => [test.id, test.branchTag])).toEqual([
        [48, "main"],
        [52, "feature-login"],
      ]);
    });

    it("answers noScanData to tags that no stored tag matches, without a request", async () => {
      const noTag = await createClient().listFindings({ scope: { testTags: { all: [] } } });
      const commaTag = await createClient().listFindings({
        scope: { testTags: { all: VULNERABILITY_REPORTS, any: ["a,b"] } },
      });

      expect(noTag).toEqual({ state: "noScanData" });
      expect(commaTag).toEqual({ state: "noScanData" });
      expect(server.requests).toEqual([]);
    });
  });

  describe("the filters", () => {
    it("filters by severity", async () => {
      const result = await createClient().listFindings({ scope: { testId: 41 }, severities: ["Critical", "High"] });

      expect(findingIds(result)).toEqual([1030, 1028, 1031]);
    });

    it.each([
      // 1032 is out of scope: DefectDojo marks it mitigated as well, and Mitigated holds the fixed findings only.
      ["mitigated", { testId: 41 }, [928, 929, 930, 931]],
      ["falsePositive", { testId: 48 }, [1023]],
      ["outOfScope", { testId: 41 }, [1032]],
      ["riskAccepted", { testId: 50 }, [1036]],
    ] as const)("lists the %s findings when it is asked for that state", async (state, scope, expected) => {
      const result = await createClient().listFindings({ scope, state });

      expect(findingIds(result)).toEqual(expected);
    });

    it("lists the active findings by default: the triaged ones of the same test stay out", async () => {
      const result = await createClient().listFindings({ scope: { testId: 41 } });

      expect(findingIds(result)).toEqual([1030, 1028, 1031, 1029]);
    });

    it("lists the findings of every state together when it is asked for any state: duplicates stay out", async () => {
      const result = await createClient().listFindings({ scope: { testId: 41 }, state: "any" });

      expect(findingIds(result)).toEqual([928, 929, 1030, 930, 931, 1028, 1031, 1029, 1032]);
      expect(result.state === "data" && result.data.total).toBe(9);
      expect(result.state === "data" && result.data.findings.map((finding) => finding.active)).toEqual([
        false,
        false,
        true,
        false,
        false,
        true,
        true,
        true,
        false,
      ]);
    });

    it("filters by vulnerability id: one id is found by both scanners of an image, apart", async () => {
      const result = await createClient().listFindings({
        scope: { productIds: [7] },
        vulnerabilityId: "CVE-2099-1001",
      });

      expect(findingIds(result)).toEqual([1030, 1033]);
      expect(result.state === "data" && result.data.findings.map((finding) => finding.test.id)).toEqual([41, 50]);
    });

    it("filters by component name, whatever its case", async () => {
      const result = await createClient().listFindings({ scope: { testId: 41 }, component: "LIBCRYPTO" });

      expect(findingIds(result)).toEqual([1028]);
    });

    it("applies no text filter for an empty vulnerability id or component", async () => {
      const result = await createClient().listFindings({ scope: { testId: 41 }, vulnerabilityId: "", component: "" });

      expect(findingIds(result)).toEqual([1030, 1028, 1031, 1029]);
    });
  });

  describe("the page", () => {
    it("returns the page asked for and the total of the filter", async () => {
      const first = await createClient().listFindings({ scope: { testId: 41 }, limit: 2, offset: 0 });
      const second = await createClient().listFindings({ scope: { testId: 41 }, limit: 2, offset: 2 });

      expect(findingIds(first)).toEqual([1030, 1028]);
      expect(findingIds(second)).toEqual([1031, 1029]);
      expect(first.state === "data" && first.data.total).toBe(4);
      expect(second.state === "data" && second.data.total).toBe(4);
    });

    it("asks for at most 100 rows, whatever the caller asks", async () => {
      const result = await createClient().listFindings({ scope: { testId: 41 }, limit: 5000 });

      expect(findingIds(result)).toEqual([1030, 1028, 1031, 1029]);
      expect(server.requests[0]?.key).toContain("limit=100");
    });
  });
});

describe("the requests of the client", () => {
  it("are GET requests, with the token of the portal's user", async () => {
    const client = createClient();

    await client.listProducts(["app.edp.epam.com/tenant:krci"]);
    await client.listTests({ tags: GO_CODEBASE_TAGS });
    await client.getSeverityCounts({ productIds: [4, 5] });
    await client.getSeverityCounts({ testId: 41 });
    await client.listFindings({ scope: { testId: 41 } });
    await client.listFindings({ scope: { productIds: [7] }, scanTypes: ["Gitleaks Scan"] });

    expect(server.requests.length).toBeGreaterThan(6);
    expect(server.requests.map(({ method }) => method)).toEqual(server.requests.map(() => "GET"));
  });
});

describe("a DefectDojo that cannot be read", () => {
  const TAGS = ["app.edp.epam.com/tenant:krci"];

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is unreachable when DefectDojo rejects the token (recorded 403)", async () => {
    const result = await createClient({ token: "a-token-defectdojo-does-not-know" }).listProducts(TAGS);

    expect(result).toEqual({ state: "unreachable" });
  });

  it("is unreachable when the connection is refused", async () => {
    const closed = net.createServer();
    await new Promise<void>((resolve) => closed.listen(0, "127.0.0.1", resolve));
    const { port } = closed.address() as AddressInfo;
    await new Promise<void>((resolve) => closed.close(() => resolve()));

    const result = await createClient({ apiBaseURL: `http://127.0.0.1:${port}` }).listProducts(TAGS);

    expect(result).toEqual({ state: "unreachable" });
  });

  it("is unreachable when DefectDojo does not answer within the timeout", async () => {
    const silent = await startStub(() => {});

    const result = await createClient({ apiBaseURL: silent, timeoutMs: 100 }).listProducts(TAGS);

    expect(result).toEqual({ state: "unreachable" });
  });

  it("is unreachable when DefectDojo answers with a server error", async () => {
    const failing = await startStub((_, response) => response.writeHead(503).end("upstream down"));

    const result = await createClient({ apiBaseURL: failing }).listProducts(TAGS);

    expect(result).toEqual({ state: "unreachable" });
  });

  it("puts no address and no token in what it returns", async () => {
    const failing = await startStub((_, response) => response.writeHead(502).end());

    const result = await createClient({ apiBaseURL: failing, token: "secret-service-token" }).listProducts(TAGS);

    expect(JSON.stringify(result)).not.toContain(failing);
    expect(JSON.stringify(result)).not.toContain("secret-service-token");
  });

  describe("a request that cannot be built from the settings", () => {
    /** Everything the server logged and everything the client returned or threw. */
    function everythingSaid(result: unknown): string {
      const logged = vi.mocked(console.error).mock.calls.flat().map(String);
      return [JSON.stringify(result), ...logged].join("\n");
    }

    it("is unreachable for an address with credentials, and says nothing of the address", async () => {
      const withCredentials = server.url.replace("http://", "http://portal-user:s3cretpass@");

      const result = await createClient({ apiBaseURL: withCredentials }).listProducts(TAGS);

      expect(result).toEqual({ state: "unreachable" });
      expect(everythingSaid(result)).not.toContain("s3cretpass");
      expect(everythingSaid(result)).not.toContain(server.url);
      expect(server.requests).toEqual([]);
    });

    it("is unreachable for a token with a line break, and says nothing of the token", async () => {
      const result = await createClient({ token: "line-one-of-token\nline-two-of-token" }).listProducts(TAGS);

      expect(result).toEqual({ state: "unreachable" });
      expect(everythingSaid(result)).not.toContain("line-one-of-token");
      expect(everythingSaid(result)).not.toContain("line-two-of-token");
      expect(server.requests).toEqual([]);
    });

    it("is unreachable on every call, not on the lists only", async () => {
      const client = createClient({ token: "bad\ntoken" });

      expect(await client.getSeverityCounts({ testId: 41 })).toEqual({ state: "unreachable" });
      expect(await client.listFindings({ scope: { testId: 41 } })).toEqual({ state: "unreachable" });
    });
  });

  it("throws an error without the cause message when a failure is none of the known ones", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new RangeError("secret-service-token in a message"));

    const failure = await createClient({ token: "secret-service-token" })
      .listProducts(TAGS)
      .then(
        () => null,
        (error: unknown) => error
      );

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe("DefectDojo read failed");
  });

  it("throws an error without the address when the answer is not what DefectDojo sends", async () => {
    const proxy = await startStub((_, response) => response.writeHead(200).end("<html>sign in</html>"));

    const failure = await createClient({ apiBaseURL: proxy, token: "secret-service-token" })
      .listProducts(TAGS)
      .then(
        () => null,
        (error: unknown) => error
      );

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe("DefectDojo returned an unexpected answer");
    expect((failure as Error).message).not.toContain(proxy);
  });
});
