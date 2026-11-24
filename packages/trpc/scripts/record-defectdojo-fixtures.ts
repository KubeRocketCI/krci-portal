/**
 * Records the DefectDojo answers that the client tests replay.
 *
 * Writes src/clients/defectDojo/__fixtures__/answers.json: one answer per request of the plan below, GET only.
 * The plan names the requests the client sends; a client test that sends another request fails on the replay.
 * The DefectDojo address is written as https://defectdojo.example.test wherever an answer repeats it.
 * The script fails when an answer holds the token.
 *
 * The plan reads the seeded testbed: the codebases test-go-app and krci-gitops of the tenant krci with Semgrep,
 * Gitleaks, Trivy Scan and Anchore Grype tests, the namespace products krci-demo-dev, krci-demo-qa and
 * krci-other-dev with the tenant tag, and the runtime tests of the security operator with their report-kind tag.
 * The DefectDojo version of the testbed is DEFECTDOJO_VERSION below; the recording carries it as `version`.
 *
 * Run from packages/trpc, with the portal's DefectDojo user (not staff, Product Type KubeRocketCI only):
 *   kubectl -n defectdojo port-forward svc/defectdojo-django <port>:80
 *   DEFECTDOJO_URL=http://localhost:<port> \
 *   DEFECTDOJO_TOKEN=$(kubectl -n krci get secret krci-portal-defectdojo -o jsonpath='{.data.token}' | base64 -d) \
 *     pnpm exec tsx scripts/record-defectdojo-fixtures.ts
 * The host is localhost: DefectDojo answers 400 to 127.0.0.1.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { stripTrailingSlash } from "@my-project/shared";
import { format, resolveConfig } from "prettier";
import { appendQuery } from "../src/clients/http/index.js";
import { FINDINGS_MAX_PAGE_SIZE, LIST_PAGE_SIZE } from "../src/clients/defectDojo/constants.js";
import {
  countsRequest,
  findingsRequest,
  productsRequest,
  testRequest,
  testsRequest,
  testTypeRequest,
  toTagFilter,
  type DefectDojoRequest,
  type FindingsRequestFilter,
} from "../src/clients/defectDojo/requests.js";
import {
  ANSWER_ORIGIN,
  requestKeyOf,
  type RecordedAnswer,
  type RecordedAnswers,
} from "../src/clients/defectDojo/__fixtures__/answers.js";

const DEFECTDOJO_VERSION = "3.5.200";
const OUTPUT = resolve("src/clients/defectDojo/__fixtures__/answers.json");

const url = stripTrailingSlash(process.env.DEFECTDOJO_URL);
const token = process.env.DEFECTDOJO_TOKEN;
if (!url || !token) {
  console.error("Set DEFECTDOJO_URL and DEFECTDOJO_TOKEN (see the header of this file).");
  process.exit(2);
}

const answers = new Map<string, RecordedAnswer>();

/** The part of a recorded list that the plan reads. */
interface RecordedPage {
  count: number;
  results: { id: number; scan_type?: string; branch_tag?: string; tags?: string[]; engagement?: number }[];
  prefetch?: { engagement?: Record<string, { product: { id: number } }> };
}

/** Sends the request, keeps the answer and returns its body. Fails on a status other than `expectedStatus`. */
async function record(request: DefectDojoRequest, expectedStatus = 200, authToken = token): Promise<RecordedPage> {
  const key = requestKeyOf(request);
  const response = await fetch(`${url}${appendQuery(request.path, request.query)}`, {
    method: "GET",
    headers: { Accept: "application/json", Authorization: `Token ${authToken}` },
  });
  if (response.status !== expectedStatus) {
    throw new Error(`${key} answered ${response.status}, expected ${expectedStatus}`);
  }
  const body = (await response.json()) as RecordedPage;
  answers.set(key, {
    request: key,
    status: response.status,
    body: JSON.parse(JSON.stringify(body).replaceAll(url, ANSWER_ORIGIN)),
  });
  console.log(`${response.status} ${key}`);
  return body;
}

function tags(...values: string[]): string {
  const filter = toTagFilter(values);
  if (filter === null) {
    throw new Error(`Unusable tags: ${values.join(" ")}`);
  }
  return filter;
}

const FIRST_PAGE = { limit: LIST_PAGE_SIZE, offset: 0 };

const GO_TAGS = ["app.edp.epam.com/codebase:test-go-app", "app.edp.epam.com/tenant:krci"];
const GITOPS_TAGS = ["app.edp.epam.com/codebase:krci-gitops", "app.edp.epam.com/tenant:krci"];
const GO_IMAGE_TAG = "oci-image:gitlab.127.0.0.1.nip.io:5050/krci/test-go-app";

function testOf(list: RecordedPage, scanType: string, branchTag: string, tag?: string): number {
  const found = list.results.find(
    (test) => test.scan_type === scanType && test.branch_tag === branchTag && (!tag || test.tags?.includes(tag))
  );
  if (!found) {
    throw new Error(`No ${scanType} test on branch ${branchTag}`);
  }
  return found.id;
}

// Join: the CI tests of a codebase, by the codebase and tenant tags.
const goTests = await record(testsRequest({ tagFilter: tags(...GO_TAGS) }, FIRST_PAGE));
const gitopsTests = await record(testsRequest({ tagFilter: tags(...GITOPS_TAGS) }, FIRST_PAGE));
await record(testsRequest({ tagFilter: tags("app.edp.epam.com/codebase:no-such-app", GO_TAGS[1]) }, FIRST_PAGE));
// The same list in pages of two.
for (const offset of [0, 2, 4]) {
  await record(testsRequest({ tagFilter: tags(...GO_TAGS) }, { limit: 2, offset }));
}

// Join: the branch of a test.
await record(testsRequest({ tagFilter: tags(...GO_TAGS), branchTag: "feature-login" }, FIRST_PAGE));
// Join: the level of a test, by its scan type.
await record(testsRequest({ tagFilter: tags(...GO_TAGS), scanType: "Trivy Scan" }, FIRST_PAGE));
// Join: the codebase's own image, by the oci-image tag.
await record(testsRequest({ tagFilter: tags(...GO_TAGS, GO_IMAGE_TAG) }, FIRST_PAGE));

// Join: the runtime tests of a codebase in an Environment, by the cluster, namespace and application tags.
await record(
  testsRequest(
    { tagFilter: tags("k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev", "app:demo-dev-test-go-app") },
    FIRST_PAGE
  )
);
// Join: the workload and container of a runtime test.
await record(
  testsRequest(
    {
      tagFilter: tags(
        "k8s-cluster:in-cluster",
        "k8s-namespace:krci-demo-dev",
        "k8s-workload:deployment.web",
        "k8s-container:istio-proxy"
      ),
    },
    FIRST_PAGE
  )
);
// A runtime test without a build id is closed.
await record(
  testsRequest({ tagFilter: tags("k8s-cluster:remote-cluster", "k8s-namespace:krci-demo-prod") }, FIRST_PAGE)
);

// Join: the report kind of a runtime test. The security operator writes the tag.
const DEV_NAMESPACE_TAGS = ["k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev"];
await record(testsRequest({ tagFilter: tags(...DEV_NAMESPACE_TAGS, "report-kind:vulnerabilityreport") }, FIRST_PAGE));
const devSecretTests = await record(
  testsRequest({ tagFilter: tags(...DEV_NAMESPACE_TAGS, "report-kind:exposedsecretreport") }, FIRST_PAGE)
);

// Join: the namespace product of an Environment, by the cluster and namespace tags.
const devProducts = await record(
  productsRequest(tags("k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev"), FIRST_PAGE)
);
await record(productsRequest(tags("k8s-cluster:remote-cluster", "k8s-namespace:krci-demo-prod"), FIRST_PAGE));
// Join: the namespaces the installation manages, by the tenant tag.
const tenantProducts = await record(productsRequest(tags("app.edp.epam.com/tenant:krci"), FIRST_PAGE));
await record(productsRequest(tags("app.edp.epam.com/tenant:other"), FIRST_PAGE));

/** Id of the product of the first test of a list. */
function productOf(list: RecordedPage): number {
  const product = list.prefetch?.engagement?.[String(list.results[0]?.engagement)]?.product;
  if (!product) {
    throw new Error("The list has no test with a product");
  }
  return product.id;
}

const runtimeProductIds = tenantProducts.results.map((product) => product.id);
const goProductId = productOf(goTests);
const gitopsProductId = productOf(gitopsTests);
const ownTrivyTest = testOf(goTests, "Trivy Scan", "main", GO_IMAGE_TAG);
const ownGrypeTest = testOf(goTests, "Anchore Grype", "main");
const goSemgrepTest = testOf(goTests, "Semgrep JSON Report", "main");
const goGitleaksTest = testOf(goTests, "Gitleaks Scan", "main");
const gitopsSemgrepTest = testOf(gitopsTests, "Semgrep JSON Report", "main");
console.log({ devProducts: devProducts.count, runtimeProductIds, goProductId, gitopsProductId, ownTrivyTest });

// Severity counts: a set of products, one product, one test in every state, a clean test and a test that does not
// exist. DefectDojo counts zero for both of the last two; the test itself tells them apart.
await record(countsRequest({ productIds: runtimeProductIds }, true));
await record(countsRequest({ productIds: [gitopsProductId] }, true));
await record(countsRequest({ testId: ownTrivyTest }, true));
await record(countsRequest({ testId: ownTrivyTest }, false));
await record(countsRequest({ testId: gitopsSemgrepTest }, true));
await record(testRequest(gitopsSemgrepTest));
await record(countsRequest({ testId: 99999 }, true));
await record(testRequest(99999), 404);

// Test types of the scan types.
const gitleaksType = (await record(testTypeRequest("Gitleaks Scan"))).results[0].id;
const trivyType = (await record(testTypeRequest("Trivy Scan"))).results[0].id;
await record(testTypeRequest("No Such Scan"));

const findings = (filter: Partial<FindingsRequestFilter> & Pick<FindingsRequestFilter, "scope">) =>
  findingsRequest({
    state: "active",
    severities: [],
    testTypeIds: [],
    limit: FINDINGS_MAX_PAGE_SIZE,
    offset: 0,
    ...filter,
  });

// Findings of a test: the secrets of a Gitleaks test, the vulnerabilities of an image test.
await record(findings({ scope: { testId: goGitleaksTest } }));
await record(findings({ scope: { testId: ownTrivyTest } }));
await record(findings({ scope: { testId: ownTrivyTest }, severities: ["Critical", "High"] }));
// The findings of a runtime test tagged report-kind:exposedsecretreport.
await record(findings({ scope: { testId: devSecretTests.results[0].id } }));
// Findings of a product, and of a product by scan type.
await record(findings({ scope: { productIds: [gitopsProductId] } }));
await record(findings({ scope: { productIds: [goProductId] }, testTypeIds: [gitleaksType] }));
await record(findings({ scope: { productIds: [gitopsProductId] }, testTypeIds: [gitleaksType, trivyType] }));
// The states other than active.
await record(findings({ scope: { testId: ownTrivyTest }, state: "mitigated" }));
await record(findings({ scope: { testId: goSemgrepTest }, state: "falsePositive" }));
await record(findings({ scope: { testId: ownTrivyTest }, state: "outOfScope" }));
await record(findings({ scope: { testId: ownGrypeTest }, state: "riskAccepted" }));
// Every state together.
await record(findings({ scope: { testId: ownTrivyTest }, state: "any" }));
// Text filters.
await record(findings({ scope: { productIds: [goProductId] }, vulnerabilityId: "CVE-2099-1001" }));
await record(findings({ scope: { testId: ownTrivyTest }, component: "LIBCRYPTO" }));
// Pages of two.
await record(findings({ scope: { testId: ownTrivyTest }, limit: 2, offset: 0 }));
await record(findings({ scope: { testId: ownTrivyTest }, limit: 2, offset: 2 }));
// A test that does not exist.
await record(findings({ scope: { testId: 99999 } }), 400);

// A token that DefectDojo rejects. The replay answers every request with a wrong token this way.
await record(productsRequest(tags("app.edp.epam.com/tenant:rejected"), FIRST_PAGE), 403, "not-a-token");

const recorded: RecordedAnswers = { version: DEFECTDOJO_VERSION, answers: [...answers.values()] };
const json = `${JSON.stringify(recorded, null, 2)}\n`;
if (json.includes(token)) {
  throw new Error("An answer holds the token.");
}
mkdirSync(dirname(OUTPUT), { recursive: true });
// plugins: [] overrides the client prettier plugin; trpc does not resolve it.
writeFileSync(OUTPUT, await format(json, { ...(await resolveConfig(OUTPUT)), plugins: [], filepath: OUTPUT }));
console.log(`Wrote ${answers.size} answers to ${OUTPUT}`);
