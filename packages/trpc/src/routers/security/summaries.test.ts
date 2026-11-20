import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SecuritySeverity } from "@my-project/shared";
import {
  DEFECTDOJO_SEVERITY_LABELS,
  SEVERITY_LISTING_LIMIT,
  type DefectDojoClient,
  type DefectDojoEngagement,
  type DefectDojoFinding,
  type DefectDojoFindingsFilter,
  type DefectDojoTest,
  type DefectDojoTestsResult,
} from "../../clients/defectdojo/index.js";
import { createTestClient, WEB_URL } from "./__fixtures__/defectdojo.js";
import type { AuthorizedStage } from "./authorization.js";
import { COUNTED_SEVERITIES } from "./engagements.js";
import { imagesByCodebase, type RuntimeInput } from "./runtime.js";
import { getCiFindingsPage, getCodebaseSummary, getEnvironmentSummary, getRuntimeFindingsPage } from "./summaries.js";

const TENANT_TAG = "k8s-ns-label.app.edp.epam.com/tenant:krci";

const APP_IMAGE = "registry.example.com/krci/test-go-app";
const APP_TAG = `oci-image:${APP_IMAGE}`;
const WORKER_IMAGE = "registry.example.com/krci/test-go-worker";

const ZERO = { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 };

const SEVERITY_ORDER: SecuritySeverity[] = ["critical", "high", "medium", "low", "unassigned"];

const NONE_PAGE = { status: "NONE", items: [], totalCount: 0, page: 1, pageSize: 25 };

const CI_ENGAGEMENTS: DefectDojoEngagement[] = [
  { id: 4, name: "scheduled scan", product: 3 },
  { id: 3, name: "code-security-main", product: 3 },
  { id: 2, name: "image:busybox", product: 3 },
  { id: 9, name: "manual pentest", product: 3 },
];

const CI_TESTS: Record<number, DefectDojoTest[]> = {
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
  9: [{ id: 30, title: "Manual", engagement: 9, tags: [] }],
};

type Severities = Partial<Record<SecuritySeverity, number>>;

interface Fixture {
  test: DefectDojoTest;
  findings: Severities;
}

type NamespaceKey = "dev" | "qa" | "prod";

/** The namespaces of the environments: `dev` and `qa` on the portal's cluster, `prod` on the remote cluster. */
const NAMESPACES: Record<NamespaceKey, { name: string; engagement: number; productId: number; remote: boolean }> = {
  dev: { name: "krci-demo-dev", engagement: 40, productId: 30, remote: false },
  qa: { name: "krci-demo-qa", engagement: 41, productId: 31, remote: false },
  prod: { name: "krci-demo-prod", engagement: 50, productId: 32, remote: true },
};

interface TestOptions {
  id: number;
  report: string;
  workload: string;
  image: string | undefined;
  version: string;
  updated: string;
  /** Defaults to whether the world requires the tenant tag. */
  withTenantTag?: boolean;
}

interface WorldOptions {
  /** The cluster name setting of the portal. */
  clusterName?: string;
  /** The cluster name the krci-security-operator of the portal's cluster writes. */
  operatorClusterName?: string;
  /** Whether the namespace tests carry the tag of the tenant label. */
  tenantTagged?: boolean;
}

/**
 * A DefectDojo with the CI product of `test-go-app` and the namespace products of the environments.
 * Every call of the client reads this data, and the findings filters are applied to it as DefectDojo applies them.
 */
function createWorld({
  clusterName = "in-cluster",
  operatorClusterName = clusterName,
  tenantTagged = false,
}: WorldOptions = {}) {
  const client = createTestClient({ clusterName });

  const clusterOf = (key: NamespaceKey) => (NAMESPACES[key].remote ? "eks-sandbox" : operatorClusterName);

  const fixtures: Fixture[] = [
    { test: { id: 17, title: "Trivy Scan", engagement: 2, tags: [] }, findings: { high: 3 } },
  ];

  const namespaces = new Map<NamespaceKey, DefectDojoTestsResult>(
    (Object.keys(NAMESPACES) as NamespaceKey[]).map((key) => {
      const { name, engagement, productId } = NAMESPACES[key];
      const product = { id: productId, name: `${clusterOf(key)}/${name}` };
      return [
        key,
        { tests: [], engagements: new Map([[engagement, { id: engagement, name: "trivy-operator", product }]]) },
      ];
    })
  );

  const namespace = (key: NamespaceKey): DefectDojoTestsResult => {
    const found = namespaces.get(key);
    if (!found) {
      throw new Error(`The world has no namespace ${key}`);
    }

    return found;
  };

  const addTest = (key: NamespaceKey, options: TestOptions, findings: Severities): DefectDojoTest => {
    const { name, engagement } = NAMESPACES[key];
    const test: DefectDojoTest = {
      id: options.id,
      title: `${options.report} ${options.workload.replace(".", "/")}/app`,
      engagement,
      tags: [
        `k8s-cluster:${clusterOf(key)}`,
        `k8s-namespace:${name}`,
        `k8s-workload:${options.workload}`,
        ...(options.image ? [`oci-image:${options.image}`] : []),
        ...((options.withTenantTag ?? tenantTagged) ? [TENANT_TAG] : []),
      ],
      test_type_name: "Trivy Operator Scan",
      version: options.version,
      updated: options.updated,
    };

    fixtures.push({ test, findings });
    namespace(key).tests.push(test);
    return test;
  };

  const app = { report: "VulnerabilityReport", workload: "deployment.test-go-app", image: APP_IMAGE };
  addTest(
    "dev",
    { ...app, id: 101, version: "main-1", updated: "2026-11-10T20:41:41.682710Z" },
    { critical: 2, high: 3, medium: 4, low: 1, unassigned: 1 }
  );
  addTest(
    "dev",
    { ...app, id: 102, report: "ExposedSecretReport", version: "main-1", updated: "2026-11-10T20:41:30.000000Z" },
    { high: 1 }
  );
  addTest(
    "dev",
    { ...app, id: 103, image: "istio/proxyv2", version: "1.24.0", updated: "2026-11-10T20:30:00.000000Z" },
    { high: 1, medium: 2 }
  );
  addTest(
    "dev",
    {
      ...app,
      id: 104,
      workload: "statefulset.redis",
      image: "redis",
      version: "7.4",
      updated: "2026-11-10T20:10:00.000000Z",
    },
    { critical: 1 }
  );
  addTest(
    "qa",
    { ...app, id: 111, version: "0.9.0", updated: "2026-11-09T10:00:00.000000Z" },
    { critical: 1, high: 1 }
  );
  addTest("prod", { ...app, id: 121, version: "1.0.0", updated: "2026-11-10T18:00:00.000000Z" }, { critical: 5 });

  const productNames = new Map(
    (Object.keys(NAMESPACES) as NamespaceKey[]).map((key) => [`${clusterOf(key)}/${NAMESPACES[key].name}`, key])
  );

  const matches = (test: DefectDojoTest, filter: DefectDojoFindingsFilter) =>
    filter.engagementIds.includes(test.engagement) &&
    (!filter.anyTestTags?.length || filter.anyTestTags.some((tag) => test.tags.includes(tag))) &&
    (!filter.allTestTags?.length || filter.allTestTags.every((tag) => test.tags.includes(tag))) &&
    !filter.excludeTestTags?.some((tag) => test.tags.includes(tag));

  const findingsOf = (filter: DefectDojoFindingsFilter) =>
    fixtures
      .filter(({ test }) => matches(test, filter))
      .flatMap(({ test, findings }) =>
        (Object.entries(findings) as [SecuritySeverity, number][]).flatMap(([severity, count]) =>
          Array.from({ length: count }, (_, index) => ({ test, severity, id: test.id * 1000 + index }))
        )
      )
      .filter(({ severity }) => !filter.severities?.length || filter.severities.includes(severity));

  const severityRank = (severity: SecuritySeverity) => SEVERITY_ORDER.indexOf(severity);

  vi.spyOn(client, "getProductByName").mockResolvedValue({ id: 3, name: "test-go-app" });
  vi.spyOn(client, "listEngagements").mockResolvedValue(CI_ENGAGEMENTS);
  vi.spyOn(client, "listTestsByEngagement").mockImplementation(async (id) => CI_TESTS[id] ?? []);
  vi.spyOn(client, "listNamespaceTests").mockImplementation(async ({ cluster, namespace: name }, requiredTags = []) => {
    const key = productNames.get(`${cluster}/${name}`);
    const found = key && namespace(key);
    const tests = found?.tests.filter((test) => requiredTags.every((tag) => test.tags.includes(tag))) ?? [];
    return { tests, engagements: found && tests.length > 0 ? found.engagements : new Map() };
  });
  vi.spyOn(client, "listFindingSeverities").mockImplementation(async (filter, limit) => {
    const labels = findingsOf(filter).map(({ severity }) => DEFECTDOJO_SEVERITY_LABELS[severity]);
    return { count: labels.length, severities: labels.slice(0, limit) };
  });
  vi.spyOn(client, "countFindings").mockImplementation(async (filter) => findingsOf(filter).length);
  vi.spyOn(client, "listFindings").mockImplementation(async (filter, { offset, limit }) => {
    const all = findingsOf(filter).sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.id - b.id);
    const page = all.slice(offset, offset + limit);
    return {
      totalCount: all.length,
      findings: page.map(
        ({ id, severity, test }): DefectDojoFinding => ({
          id,
          title: `CVE-2026-${id} libcrypto3 3.5.6-r0`,
          severity: DEFECTDOJO_SEVERITY_LABELS[severity],
          test: test.id,
          vulnerability_ids: [{ vulnerability_id: `CVE-2026-${id}` }],
          component_name: "libcrypto3",
          component_version: "3.5.6-r0",
          fix_available: true,
          mitigation: "3.5.8-r0",
        })
      ),
      tests: new Map(page.map(({ test }) => [test.id, test])),
    };
  });

  return { client, fixtures, namespace, addTest };
}

type World = ReturnType<typeof createWorld>;

/** The findings of one of the tests of the world. */
function setFindings(world: World, testId: number, findings: Severities) {
  const fixture = world.fixtures.find(({ test }) => test.id === testId);
  if (!fixture) {
    throw new Error(`The world has no test ${testId}`);
  }

  fixture.findings = findings;
}

/** A test of the `dev` namespace of the codebase that carries no tenant tag. */
function addStrayTest(world: World, findings: Severities): DefectDojoTest {
  return world.addTest(
    "dev",
    {
      id: 105,
      report: "VulnerabilityReport",
      workload: "deployment.stray",
      image: APP_IMAGE,
      version: "x",
      updated: "2026-11-10T20:00:00.000000Z",
      withTenantTag: false,
    },
    findings
  );
}

/** Mocks the findings page the client reads, whatever the filter. */
function mockFindings(
  client: DefectDojoClient,
  findings: DefectDojoFinding[],
  tests: DefectDojoTest[],
  totalCount = findings.length
) {
  vi.spyOn(client, "listFindings").mockResolvedValue({
    totalCount,
    findings,
    tests: new Map(tests.map((test) => [test.id, test])),
  });
}

function expectNamespaceRead(
  client: DefectDojoClient,
  target: { cluster: string; namespace: string; environment: string },
  tenantTags: readonly string[] = []
) {
  expect(client.listNamespaceTests).toHaveBeenCalledWith(target, tenantTags);
}

function stage(name: string, namespace: string, overrides: Partial<AuthorizedStage> = {}): AuthorizedStage {
  return { cdPipeline: "demo", stage: name, clusterName: "in-cluster", namespace, available: true, ...overrides };
}

function imageStream(codebase: string, imageName: string) {
  return { spec: { codebase, imageName } };
}

const DEV = stage("dev", "krci-demo-dev");
const QA = stage("qa", "krci-demo-qa");
const PROD = stage("prod", "krci-demo-prod", { clusterName: "eks-sandbox" });

/** Stages the portal reads nothing for. */
const UNREADABLE_STAGES: [string, AuthorizedStage][] = [
  ["is not available", stage("dev", "krci-demo-dev", { available: false })],
  ["has a namespace that is not a DNS label", stage("dev", "krci-demo-dev,x")],
];

/** What the environments read when the cluster name setting is `core`. */
const CLUSTER_READS: [string, AuthorizedStage, { cluster: string; namespace: string; environment: string }][] = [
  [
    "a Stage of the portal's cluster under the cluster name setting",
    DEV,
    { cluster: "core", namespace: "krci-demo-dev", environment: "demo/dev" },
  ],
  [
    "a Stage with no cluster name as a Stage of the portal's cluster",
    stage("dev", "krci-demo-dev", { clusterName: "" }),
    { cluster: "core", namespace: "krci-demo-dev", environment: "demo/dev" },
  ],
  [
    "a Stage of a remote cluster under its own cluster name",
    PROD,
    { cluster: "eks-sandbox", namespace: "krci-demo-prod", environment: "demo/prod" },
  ],
];

function runtimeInput(overrides: Partial<RuntimeInput> = {}): RuntimeInput {
  return {
    stages: [DEV, QA, PROD],
    images: imagesByCodebase([imageStream("test-go-app", APP_IMAGE), imageStream("test-go-app", APP_IMAGE)]),
    tenantTags: [],
    ...overrides,
  };
}

const DEV_ROW = {
  environment: "demo/dev",
  workloads: ["deployment/test-go-app"],
  versions: ["main-1"],
  tools: ["Trivy Operator Scan"],
  counts: { critical: 2, high: 4, medium: 4, low: 1, unassigned: 1 },
  updated: "2026-11-10T20:41:41.682710Z",
  link: `${WEB_URL}/engagement/40`,
};

const QA_ROW = {
  environment: "demo/qa",
  workloads: ["deployment/test-go-app"],
  versions: ["0.9.0"],
  tools: ["Trivy Operator Scan"],
  counts: { ...ZERO, critical: 1, high: 1 },
  updated: "2026-11-09T10:00:00.000000Z",
  link: `${WEB_URL}/engagement/41`,
};

const PROD_ROW = {
  environment: "demo/prod",
  workloads: ["deployment/test-go-app"],
  versions: ["1.0.0"],
  tools: ["Trivy Operator Scan"],
  counts: { ...ZERO, critical: 5 },
  updated: "2026-11-10T18:00:00.000000Z",
  link: `${WEB_URL}/engagement/50`,
};

describe("getCodebaseSummary", () => {
  let world: World;
  let client: DefectDojoClient;

  beforeEach(() => {
    world = createWorld();
    client = world.client;
  });

  it("summarizes the CI scans and the runtime scans of every environment of the codebase", async () => {
    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput());

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
          link: `${WEB_URL}/engagement/3`,
        },
        {
          kind: "image",
          engagement: "image:busybox",
          image: "busybox",
          tag: "1.38.0",
          tools: ["Anchore Grype", "Trivy Scan"],
          counts: { ...ZERO, high: 3 },
          updated: "2026-11-10T19:57:35.945959Z",
          link: `${WEB_URL}/engagement/2`,
        },
      ],
      runtime: [DEV_ROW, PROD_ROW, QA_ROW],
      link: `${WEB_URL}/product/3`,
    });
  });

  it("reads the CI product, one namespace per environment and one findings listing per row", async () => {
    const runtime = runtimeInput();

    const summary = await getCodebaseSummary(client, "test-go-app", runtime);

    expect(client.getProductByName).toHaveBeenCalledTimes(1);
    expect(client.listEngagements).toHaveBeenCalledTimes(1);
    expect(client.listTestsByEngagement).toHaveBeenCalledTimes(summary.ci.length);
    expect(client.listTestsByEngagement).toHaveBeenCalledWith(3);
    expect(client.listTestsByEngagement).toHaveBeenCalledWith(2);
    expect(client.listNamespaceTests).toHaveBeenCalledTimes(runtime.stages.length);
    expect(client.listFindingSeverities).toHaveBeenCalledTimes(summary.ci.length + summary.runtime.length);
    expect(client.countFindings).not.toHaveBeenCalled();
  });

  it("scopes the findings of a runtime row to the engagement of the namespace and the images of the codebase", async () => {
    await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [DEV] }));

    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [40], anyTestTags: [APP_TAG], allTestTags: [] },
      SEVERITY_LISTING_LIMIT
    );
  });

  it("counts a row above the listing limit per severity", async () => {
    setFindings(world, 111, { high: 20, medium: 40 });

    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [QA] }));

    expect(summary.runtime[0].counts).toEqual({ ...ZERO, high: 20, medium: 40 });
    expect(client.countFindings).toHaveBeenCalledTimes(COUNTED_SEVERITIES.length);
    expect(client.countFindings).toHaveBeenCalledWith({
      engagementIds: [41],
      anyTestTags: [APP_TAG],
      allTestTags: [],
      severities: ["critical"],
    });
  });

  it("answers the runtime rows of the Stages alone for a codebase without a product in DefectDojo", async () => {
    vi.spyOn(client, "getProductByName").mockResolvedValue(null);

    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [DEV] }));

    expect(summary).toEqual({ status: "OK", codebase: "test-go-app", ci: [], runtime: [DEV_ROW] });
    expect(client.listEngagements).not.toHaveBeenCalled();
  });

  it("leaves out the engagements that carry no CI prefix", async () => {
    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [] }));

    expect(client.listTestsByEngagement).toHaveBeenCalledTimes(summary.ci.length);
    expect(client.listTestsByEngagement).not.toHaveBeenCalledWith(4);
    expect(client.listTestsByEngagement).not.toHaveBeenCalledWith(9);
    expect(client.listFindingSeverities).toHaveBeenCalledTimes(summary.ci.length);
  });

  it("answers NONE for a codebase that DefectDojo does not know and that runs nowhere", async () => {
    vi.spyOn(client, "getProductByName").mockResolvedValue(null);

    expect(await getCodebaseSummary(client, "unknown", runtimeInput({ stages: [] }))).toEqual({
      status: "NONE",
      codebase: "unknown",
      ci: [],
      runtime: [],
    });
    expect(client.listFindingSeverities).not.toHaveBeenCalled();
  });

  it("answers NONE for a product without CI scans in a codebase that runs nowhere", async () => {
    vi.spyOn(client, "listEngagements").mockResolvedValue([{ id: 9, name: "manual pentest", product: 3 }]);

    expect(await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [] }))).toEqual({
      status: "NONE",
      codebase: "test-go-app",
      ci: [],
      runtime: [],
    });
  });

  it("leaves out an environment whose namespace holds no test of the images of the codebase", async () => {
    const summary = await getCodebaseSummary(
      client,
      "test-go-app",
      runtimeInput({ images: imagesByCodebase([imageStream("test-go-app", WORKER_IMAGE)]) })
    );

    expect(summary.runtime).toEqual([]);
    expect(summary.ci).toHaveLength(2);
  });

  it.each([
    ["a codebase without images", new Map()],
    ["a caller who may not list the image streams", undefined],
  ])("reads no namespace for %s and gives the CI scans", async (_name, images) => {
    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput({ images }));

    expect(summary.ci).toHaveLength(2);
    expect(summary.runtime).toEqual([]);
    expect(client.listNamespaceTests).not.toHaveBeenCalled();
  });

  it("gives the CI scans alone when the caller can read no Stage of the codebase", async () => {
    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [] }));

    expect(summary.ci).toHaveLength(2);
    expect(summary.runtime).toEqual([]);
    expect(client.listNamespaceTests).not.toHaveBeenCalled();
  });

  it.each(CLUSTER_READS)("reads %s", async (_name, readStage, target) => {
    world = createWorld({ clusterName: "core" });

    const summary = await getCodebaseSummary(world.client, "test-go-app", runtimeInput({ stages: [readStage] }));

    expect(summary.runtime).toHaveLength(1);
    expectNamespaceRead(world.client, target);
  });

  it("shows nothing for an environment whose cluster has no products under the configured name", async () => {
    world = createWorld({ clusterName: "wrong", operatorClusterName: "in-cluster" });

    const summary = await getCodebaseSummary(world.client, "test-go-app", runtimeInput({ stages: [DEV, QA] }));

    expect(summary.runtime).toEqual([]);
  });

  it.each(UNREADABLE_STAGES)("reads nothing for a Stage that %s", async (_name, unreadable) => {
    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [unreadable] }));

    expect(summary.runtime).toEqual([]);
    expect(client.listNamespaceTests).not.toHaveBeenCalled();
  });

  it("shows two Stages on one namespace as two environments with the same data", async () => {
    const summary = await getCodebaseSummary(
      client,
      "test-go-app",
      runtimeInput({ stages: [stage("dev", "krci-demo-dev"), stage("preview", "krci-demo-dev")] })
    );

    expect(summary.runtime).toEqual([DEV_ROW, { ...DEV_ROW, environment: "demo/preview" }]);
  });

  it("links to the product of a namespace whose tests are spread over several engagements", async () => {
    const namespace = world.namespace("dev");
    namespace.engagements.set(41, {
      id: 41,
      name: "trivy-operator",
      product: { id: 30, name: "in-cluster/krci-demo-dev" },
    });
    namespace.tests.push({ ...namespace.tests[0], id: 199, engagement: 41 });

    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [DEV] }));

    expect(summary.runtime[0].link).toBe(`${WEB_URL}/product/30`);
  });

  it("orders the runtime rows by environment name", async () => {
    const summary = await getCodebaseSummary(client, "test-go-app", runtimeInput({ stages: [QA, PROD, DEV] }));

    expect(summary.runtime.map((row) => row.environment)).toEqual(["demo/dev", "demo/prod", "demo/qa"]);
  });

  describe("with the tenant tag required", () => {
    beforeEach(() => {
      world = createWorld({ tenantTagged: true });
      client = world.client;
    });

    it("asks for the tenant tag and counts only the tests that carry it", async () => {
      addStrayTest(world, { critical: 9 });

      const summary = await getCodebaseSummary(
        client,
        "test-go-app",
        runtimeInput({ stages: [DEV], tenantTags: [TENANT_TAG] })
      );

      expectNamespaceRead(client, { cluster: "in-cluster", namespace: "krci-demo-dev", environment: "demo/dev" }, [
        TENANT_TAG,
      ]);
      expect(client.listFindingSeverities).toHaveBeenCalledWith(
        { engagementIds: [40], anyTestTags: [APP_TAG], allTestTags: [TENANT_TAG] },
        SEVERITY_LISTING_LIMIT
      );
      expect(summary.runtime[0]).toMatchObject({ workloads: ["deployment/test-go-app"], counts: DEV_ROW.counts });
    });

    it("shows nothing for a namespace whose tests carry no tenant tag", async () => {
      world = createWorld();

      const summary = await getCodebaseSummary(world.client, "test-go-app", runtimeInput({ tenantTags: [TENANT_TAG] }));

      expect(summary.runtime).toEqual([]);
    });
  });
});

describe("getEnvironmentSummary", () => {
  const IMAGES = imagesByCodebase([imageStream("test-go-app", APP_IMAGE), imageStream("test-go-worker", WORKER_IMAGE)]);
  const RUNTIME = { images: IMAGES, tenantTags: [] };

  let world: World;
  let client: DefectDojoClient;

  beforeEach(() => {
    world = createWorld();
    client = world.client;
  });

  it("summarizes the applications and the workloads that belong to no codebase", async () => {
    const summary = await getEnvironmentSummary(client, DEV, RUNTIME);

    expect(summary).toEqual({
      status: "OK",
      environment: "demo/dev",
      applications: [
        {
          codebase: "test-go-app",
          workloads: ["deployment/test-go-app"],
          versions: ["main-1"],
          counts: DEV_ROW.counts,
          updated: "2026-11-10T20:41:41.682710Z",
          link: `${WEB_URL}/engagement/40`,
        },
      ],
      other: {
        counts: { ...ZERO, critical: 1, high: 1, medium: 2 },
        workloads: ["deployment/test-go-app", "statefulset/redis"],
        updated: "2026-11-10T20:30:00.000000Z",
        link: `${WEB_URL}/engagement/40`,
      },
    });
  });

  it("reads the namespace once and one findings listing per row", async () => {
    const summary = await getEnvironmentSummary(client, DEV, RUNTIME);

    expect(client.listNamespaceTests).toHaveBeenCalledTimes(1);
    expectNamespaceRead(client, { cluster: "in-cluster", namespace: "krci-demo-dev", environment: "demo/dev" });
    expect(client.getProductByName).not.toHaveBeenCalled();
    expect(client.listFindingSeverities).toHaveBeenCalledTimes(summary.applications.length + (summary.other ? 1 : 0));
    expect(client.countFindings).not.toHaveBeenCalled();
  });

  it("scopes the application row to its images and the other row to the namespace without them", async () => {
    await getEnvironmentSummary(client, DEV, RUNTIME);

    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [40], anyTestTags: [APP_TAG], allTestTags: [] },
      SEVERITY_LISTING_LIMIT
    );
    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [40], excludeTestTags: [APP_TAG], allTestTags: [] },
      SEVERITY_LISTING_LIMIT
    );
  });

  it("has no `other` row when every workload belongs to a codebase", async () => {
    const summary = await getEnvironmentSummary(client, QA, RUNTIME);

    expect(summary.other).toBeUndefined();
    expect(summary.applications).toEqual([
      {
        codebase: "test-go-app",
        workloads: ["deployment/test-go-app"],
        versions: ["0.9.0"],
        counts: QA_ROW.counts,
        updated: "2026-11-09T10:00:00.000000Z",
        link: `${WEB_URL}/engagement/41`,
      },
    ]);
    expect(client.listFindingSeverities).toHaveBeenCalledTimes(summary.applications.length);
  });

  it("has no applications when the images belong to no codebase", async () => {
    const summary = await getEnvironmentSummary(client, DEV, { images: new Map(), tenantTags: [] });

    expect(summary.applications).toEqual([]);
    expect(summary.other).toMatchObject({ counts: { critical: 3, high: 5, medium: 6, low: 1, unassigned: 1 } });
    expect(client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [40], excludeTestTags: [], allTestTags: [] },
      SEVERITY_LISTING_LIMIT
    );
  });

  it("gives a test of a shared image to each codebase that runs it, and not to `other`", async () => {
    const images = imagesByCodebase([imageStream("alpha", APP_IMAGE), imageStream("beta", APP_IMAGE)]);

    const summary = await getEnvironmentSummary(client, DEV, { images, tenantTags: [] });

    expect(summary.applications.map(({ codebase, counts }) => [codebase, counts])).toEqual([
      ["alpha", DEV_ROW.counts],
      ["beta", DEV_ROW.counts],
    ]);
    expect(summary.other?.workloads).toEqual(["deployment/test-go-app", "statefulset/redis"]);
    expect(summary.other?.counts).toEqual({ ...ZERO, critical: 1, high: 1, medium: 2 });
  });

  it("orders the applications by codebase", async () => {
    const images = imagesByCodebase([imageStream("zeta", APP_IMAGE), imageStream("alpha", "redis")]);

    const summary = await getEnvironmentSummary(client, DEV, { images, tenantTags: [] });

    expect(summary.applications.map(({ codebase }) => codebase)).toEqual(["alpha", "zeta"]);
  });

  it.each(CLUSTER_READS)("reads %s", async (_name, readStage, target) => {
    world = createWorld({ clusterName: "core" });

    const summary = await getEnvironmentSummary(world.client, readStage, RUNTIME);

    expect(summary.status).toBe("OK");
    expectNamespaceRead(world.client, target);
  });

  it.each(UNREADABLE_STAGES)(
    "answers NONE for a Stage that %s, without reading DefectDojo",
    async (_name, unreadable) => {
      expect(await getEnvironmentSummary(client, unreadable, RUNTIME)).toEqual({
        status: "NONE",
        environment: "demo/dev",
        applications: [],
      });
      expect(client.listNamespaceTests).not.toHaveBeenCalled();
    }
  );

  it("answers NONE when the caller may not list the image streams", async () => {
    const summary = await getEnvironmentSummary(client, DEV, { images: undefined, tenantTags: [] });

    expect(summary).toEqual({ status: "NONE", environment: "demo/dev", applications: [] });
    expect(client.listNamespaceTests).not.toHaveBeenCalled();
  });

  it("answers NONE for a namespace without tests", async () => {
    vi.spyOn(client, "listNamespaceTests").mockResolvedValue({ tests: [], engagements: new Map() });

    expect(await getEnvironmentSummary(client, DEV, RUNTIME)).toEqual({
      status: "NONE",
      environment: "demo/dev",
      applications: [],
    });
    expect(client.listFindingSeverities).not.toHaveBeenCalled();
  });

  it("links to the product when the namespace tests are spread over several engagements", async () => {
    const namespace = world.namespace("qa");
    namespace.engagements.set(42, {
      id: 42,
      name: "trivy-operator",
      product: { id: 31, name: "in-cluster/krci-demo-qa" },
    });
    namespace.tests.push({ id: 198, title: "x", engagement: 42, tags: [APP_TAG] });

    const summary = await getEnvironmentSummary(client, QA, RUNTIME);

    expect(summary.applications[0].link).toBe(`${WEB_URL}/product/31`);
  });

  it("counts a row above the listing limit per severity", async () => {
    setFindings(world, 104, { critical: 20, high: 40 });

    const summary = await getEnvironmentSummary(client, DEV, RUNTIME);

    expect(summary.other?.counts).toEqual({ ...ZERO, critical: 20, high: 41, medium: 2 });
    expect(client.countFindings).toHaveBeenCalledTimes(COUNTED_SEVERITIES.length);
  });

  it("asks for the tenant tag and keeps the tests of the namespace that carry it", async () => {
    world = createWorld({ tenantTagged: true });
    addStrayTest(world, { critical: 9 });

    const summary = await getEnvironmentSummary(world.client, DEV, { images: IMAGES, tenantTags: [TENANT_TAG] });

    expectNamespaceRead(world.client, { cluster: "in-cluster", namespace: "krci-demo-dev", environment: "demo/dev" }, [
      TENANT_TAG,
    ]);
    expect(summary.applications[0].counts).toEqual(DEV_ROW.counts);
    expect(summary.other?.counts).toEqual({ ...ZERO, critical: 1, high: 1, medium: 2 });
    expect(world.client.listFindingSeverities).toHaveBeenCalledWith(
      { engagementIds: [40], excludeTestTags: [APP_TAG], allTestTags: [TENANT_TAG] },
      SEVERITY_LISTING_LIMIT
    );
  });
});

describe("getRuntimeFindingsPage", () => {
  const BASE = { codebase: "test-go-app", scope: "runtime" as const, page: 1, pageSize: 25 };

  let world: World;
  let client: DefectDojoClient;

  beforeEach(() => {
    world = createWorld();
    client = world.client;
  });

  it("maps the findings of the namespaces of every environment of the codebase", async () => {
    const page = await getRuntimeFindingsPage(client, { ...BASE, pageSize: 100 }, runtimeInput());

    expect(page.status).toBe("OK");
    expect(page.totalCount).toBe(19);
    expect(page.items[0]).toEqual({
      id: 101000,
      severity: "critical",
      title: "CVE-2026-101000 libcrypto3 3.5.6-r0",
      vulnId: "CVE-2026-101000",
      component: "libcrypto3",
      version: "3.5.6-r0",
      fixedVersion: "3.5.8-r0",
      scope: "runtime",
      environment: "demo/dev",
      workload: "deployment/test-go-app",
      engagement: "trivy-operator",
      link: `${WEB_URL}/finding/101000`,
    });
    expect(page.items.map(({ environment }) => environment)).toEqual(
      expect.arrayContaining(["demo/dev", "demo/qa", "demo/prod"])
    );
    const severities = page.items.map(({ severity }) => severity);
    expect(severities).toEqual([...severities].sort((a, b) => SEVERITY_ORDER.indexOf(a) - SEVERITY_ORDER.indexOf(b)));
  });

  it("lists the findings of all environments with one request scoped to their engagements and the images", async () => {
    const runtime = runtimeInput();

    await getRuntimeFindingsPage(client, BASE, runtime);

    expect(client.listFindings).toHaveBeenCalledTimes(1);
    expect(client.listFindings).toHaveBeenCalledWith(
      { engagementIds: [40, 41, 50], severities: undefined, anyTestTags: [APP_TAG], allTestTags: [] },
      { offset: 0, limit: 25 }
    );
    expect(client.listNamespaceTests).toHaveBeenCalledTimes(runtime.stages.length);
    expect(client.getProductByName).not.toHaveBeenCalled();
  });

  it("reads the requested page", async () => {
    await getRuntimeFindingsPage(client, { ...BASE, page: 3, pageSize: 10 }, runtimeInput());

    expect(client.listFindings).toHaveBeenCalledWith(expect.anything(), { offset: 20, limit: 10 });
  });

  it("reads only the namespace of the requested environment", async () => {
    const page = await getRuntimeFindingsPage(client, { ...BASE, environment: "demo/qa" }, runtimeInput());

    expect(client.listNamespaceTests).toHaveBeenCalledTimes(1);
    expectNamespaceRead(client, { cluster: "in-cluster", namespace: "krci-demo-qa", environment: "demo/qa" });
    expect(client.listFindings).toHaveBeenCalledWith(
      expect.objectContaining({ engagementIds: [41] }),
      expect.anything()
    );
    expect(page.items.every(({ environment }) => environment === "demo/qa")).toBe(true);
    expect(page.totalCount).toBe(2);
  });

  it("narrows to the requested severities", async () => {
    const page = await getRuntimeFindingsPage(client, { ...BASE, severity: ["critical"] }, runtimeInput());

    expect(client.listFindings).toHaveBeenCalledWith(
      expect.objectContaining({ severities: ["critical"] }),
      expect.anything()
    );
    expect(page.items.every(({ severity }) => severity === "critical")).toBe(true);
    expect(page.totalCount).toBe(8);
  });

  it("answers NONE for an environment that is not a Stage of the codebase, without reading DefectDojo", async () => {
    const page = await getRuntimeFindingsPage(client, { ...BASE, environment: "demo/staging" }, runtimeInput());

    expect(page).toEqual(NONE_PAGE);
    expect(client.listNamespaceTests).not.toHaveBeenCalled();
    expect(client.listFindings).not.toHaveBeenCalled();
  });

  it.each(UNREADABLE_STAGES)("leaves out a Stage that %s", async (_name, unreadable) => {
    await getRuntimeFindingsPage(client, BASE, runtimeInput({ stages: [DEV, { ...unreadable, stage: "qa" }] }));

    expect(client.listFindings).toHaveBeenCalledWith(
      expect.objectContaining({ engagementIds: [40] }),
      expect.anything()
    );
  });

  it.each([
    ["the caller can read no Stage of the codebase", runtimeInput({ stages: [] })],
    ["the caller may not list the image streams", runtimeInput({ images: undefined })],
    [
      "no test of the namespaces runs an image of the codebase",
      runtimeInput({ images: imagesByCodebase([imageStream("test-go-app", WORKER_IMAGE)]) }),
    ],
  ])("answers NONE when %s", async (_name, runtime) => {
    expect(await getRuntimeFindingsPage(client, BASE, runtime)).toEqual(NONE_PAGE);
    expect(client.listFindings).not.toHaveBeenCalled();
  });

  it("names the first environment by name as the owner of a namespace that two Stages share", async () => {
    const page = await getRuntimeFindingsPage(
      client,
      { ...BASE, pageSize: 100 },
      runtimeInput({ stages: [stage("preview", "krci-demo-dev"), stage("dev", "krci-demo-dev")] })
    );

    expect(new Set(page.items.map(({ environment }) => environment))).toEqual(new Set(["demo/dev"]));
  });

  it("scopes the findings to the tenant tag when one is required", async () => {
    world = createWorld({ tenantTagged: true });

    await getRuntimeFindingsPage(world.client, BASE, runtimeInput({ stages: [DEV], tenantTags: [TENANT_TAG] }));

    expect(world.client.listFindings).toHaveBeenCalledWith(
      { engagementIds: [40], severities: undefined, anyTestTags: [APP_TAG], allTestTags: [TENANT_TAG] },
      expect.anything()
    );
  });

  it("answers OK with no items when the severity filter matches nothing", async () => {
    const page = await getRuntimeFindingsPage(
      client,
      { ...BASE, severity: ["low"], environment: "demo/qa" },
      runtimeInput()
    );

    expect(page).toEqual({ ...NONE_PAGE, status: "OK" });
  });

  it("fails on a finding of a test outside the requested engagements", async () => {
    mockFindings(
      client,
      [{ id: 9105, title: "CVE", severity: "Info", test: 999 }],
      [{ id: 999, title: "x", engagement: 77, tags: [] }]
    );

    await expect(getRuntimeFindingsPage(client, BASE, runtimeInput())).rejects.toThrow(
      "outside the requested engagements"
    );
  });
});

describe("getCiFindingsPage", () => {
  const CI = { codebase: "test-go-app", scope: "ci" as const, page: 1, pageSize: 25 };

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
    client = createWorld().client;
    mockFindings(client, [CODE_FINDING], [CI_TESTS[3][1]]);
  });

  it("maps the findings", async () => {
    expect((await getCiFindingsPage(client, CI)).items).toEqual([
      {
        id: 9300,
        severity: "critical",
        title: "Hardcoded secret",
        component: "cmd/main.go",
        version: "",
        scope: "ci",
        branch: "main",
        engagement: "code-security-main",
        link: `${WEB_URL}/finding/9300`,
      },
    ]);
  });

  it("reads the requested page of the CI engagements, without a tag filter, and reads no test of them", async () => {
    await getCiFindingsPage(client, { ...CI, page: 3, pageSize: 10 });

    expect(client.listFindings).toHaveBeenCalledWith(
      { engagementIds: [3, 2], severities: undefined },
      { offset: 20, limit: 10 }
    );
    expect(client.listTestsByEngagement).not.toHaveBeenCalled();
    expect(client.listNamespaceTests).not.toHaveBeenCalled();
  });

  it("prefers fix_version over the mitigation text", async () => {
    mockFindings(client, [{ ...CODE_FINDING, fix_version: "9.9.9" }], [CI_TESTS[3][1]]);

    expect((await getCiFindingsPage(client, CI)).items[0].fixedVersion).toBe("9.9.9");
  });

  it("reads the mitigation of a finding with a fix as its fixed version", async () => {
    mockFindings(client, [{ ...CODE_FINDING, fix_available: true, mitigation: "2.0.1" }], [CI_TESTS[3][1]]);

    expect((await getCiFindingsPage(client, CI)).items[0].fixedVersion).toBe("2.0.1");
  });

  it("falls back from empty strings the way missing values do", async () => {
    mockFindings(
      client,
      [
        {
          ...CODE_FINDING,
          vulnerability_ids: [{ vulnerability_id: "" }],
          component_name: "",
          file_path: "pkg/lib.go",
          component_version: null,
          fix_version: "",
          fix_available: true,
          mitigation: "",
        },
      ],
      [CI_TESTS[3][1]]
    );

    const [item] = (await getCiFindingsPage(client, CI)).items;

    expect(item.vulnId).toBeUndefined();
    expect(item.component).toBe("pkg/lib.go");
    expect(item.version).toBe("");
    expect(item.fixedVersion).toBeUndefined();
  });

  it("rejects an environment of the CI scope", async () => {
    await expect(getCiFindingsPage(client, { ...CI, environment: "demo/dev" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(client.getProductByName).not.toHaveBeenCalled();
  });

  it("answers NONE for a codebase DefectDojo does not know", async () => {
    vi.spyOn(client, "getProductByName").mockResolvedValue(null);

    expect(await getCiFindingsPage(client, CI)).toEqual(NONE_PAGE);
    expect(client.listFindings).not.toHaveBeenCalled();
  });

  it("answers NONE for a product without CI engagements", async () => {
    vi.spyOn(client, "listEngagements").mockResolvedValue([{ id: 4, name: "scheduled scan", product: 3 }]);

    expect((await getCiFindingsPage(client, CI)).status).toBe("NONE");
    expect(client.listFindings).not.toHaveBeenCalled();
  });

  it("fails on a finding of a test outside the requested engagements", async () => {
    mockFindings(client, [{ ...CODE_FINDING, test: 999 }], []);

    await expect(getCiFindingsPage(client, CI)).rejects.toThrow("outside the requested engagements");
  });
});
