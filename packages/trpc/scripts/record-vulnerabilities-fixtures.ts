/**
 * Records the Storybook data of the Security > Vulnerabilities page from the testbed.
 *
 * Writes apps/client/src/modules/platform/security/pages/vulnerabilities/__fixtures__/testbed.json: the answers of
 * `defectDojo.getFindingsScope` and `defectDojo.getVulnerabilities`, composed by the server code against the live
 * DefectDojo of the testbed and the Stages, Applications and Codebases of the namespace `NAMESPACE` (a
 * `kubectl get -o json` dump, read through the same code the procedures use). The DefectDojo address is written as
 * `ANSWER_ORIGIN` in every link.
 * The script fails when the output holds the token or the address it read from.
 *
 * The scope and one list are also recorded for DefectDojo not configured and for DefectDojo at an address that refuses
 * the connection (unreachable). The names of the Codebases of the dump fill the codebase select of the Code and
 * Image lists.
 *
 * Run from packages/trpc, with the portal's DefectDojo user (not staff, Product Type KubeRocketCI only):
 *   kubectl -n defectdojo port-forward svc/defectdojo-django <port>:80
 *   kubectl -n krci get stages.v2.edp.epam.com,applications.argoproj.io,codebases.v2.edp.epam.com \
 *     -o json > "$TMPDIR/krci-objects.json"
 *   DEFECTDOJO_URL=http://localhost:<port> \
 *   DEFECTDOJO_TOKEN=$(kubectl -n krci get secret krci-portal-defectdojo -o jsonpath='{.data.token}' | base64 -d) \
 *     pnpm exec tsx scripts/record-vulnerabilities-fixtures.ts --k8s-file "$TMPDIR/krci-objects.json"
 * The host is localhost: DefectDojo answers 400 to 127.0.0.1.
 */
import { resolve } from "node:path";
import {
  k8sCodebaseConfig,
  vulnerabilitiesInputSchema,
  type FindingsScope,
  type Vulnerabilities,
  type VulnerabilitiesInput,
  type VulnerabilitiesRequest,
} from "@my-project/shared";
import { ANSWER_ORIGIN } from "../src/clients/defectDojo/__fixtures__/answers.js";
import { DefectDojoClient } from "../src/clients/defectDojo/index.js";
import type { KubeObject } from "../src/routers/defectDojo/__fixtures__/kubeReader.js";
import { readPlatformFacts } from "../src/routers/defectDojo/platformFindings/facts.js";
import { NAMESPACE_PRODUCT_TAG_TEXT, toFindingsScope } from "../src/routers/defectDojo/platformFindings/scope.js";
import { readVulnerabilities } from "../src/routers/defectDojo/platformFindings/vulnerabilities.js";
import { outageClients, readRecorderSettings } from "./lib/defectDojoRecorder.js";
import { readKubeObjectsFile } from "./lib/kubeObjects.js";
import { writeFixtureJson } from "./lib/writeFixture.js";

const OUTPUT = resolve(
  "../../apps/client/src/modules/platform/security/pages/vulnerabilities/__fixtures__/testbed.json"
);

const NAMESPACE = "krci";

const { url, token, k8sFile } = readRecorderSettings();
const reader = readKubeObjectsFile(k8sFile);
const facts = await readPlatformFacts(reader, NAMESPACE, { applications: true });

const defectDojo = new DefectDojoClient({ apiBaseURL: url, token, webBaseURL: ANSWER_ORIGIN });

interface RecordedList {
  input: VulnerabilitiesRequest;
  output: Vulnerabilities;
}

function describeList({ output }: RecordedList): string {
  if (output.state !== "data") {
    return output.state;
  }
  const clusters = output.clusters?.join(", ") ?? "every cluster";
  return `data, ${output.findings.length} rows of ${output.total}, ${clusters}${output.truncated ? ", truncated" : ""}`;
}

async function recordList(source: DefectDojoClient, name: string, input: VulnerabilitiesInput): Promise<RecordedList> {
  const request = vulnerabilitiesInputSchema.parse(input);
  const output = await readVulnerabilities(source, facts, request);
  const recorded = { input: request, output };
  console.log(`${name}: ${describeList(recorded)}`);
  return recorded;
}

const recordScope = (source: DefectDojoClient): Promise<FindingsScope> =>
  source.listProductsWithTagText(NAMESPACE_PRODUCT_TAG_TEXT).then((products) => toFindingsScope(facts, products));

const runtime = (filters: Omit<Extract<VulnerabilitiesInput, { level: "runtime" }>, "level" | "namespace"> = {}) =>
  ({ level: "runtime", namespace: NAMESPACE, ...filters }) satisfies VulnerabilitiesInput;

const scope = await recordScope(defectDojo);
console.log(`scope: ${scope.state}`);

const runtimeDefault = await recordList(defectDojo, "runtime default", runtime());
if (runtimeDefault.output.state !== "data" || runtimeDefault.output.findings.length === 0) {
  throw new Error("The default Runtime list holds no findings: the filters below are taken from its rows.");
}
const { findings: defaultRows } = runtimeDefault.output;

const vulnerabilityId = defaultRows.flatMap((finding) => finding.vulnerabilityIds)[0];
const componentName = (defaultRows.find((finding) => (finding.componentName?.length ?? 0) >= 5) ?? defaultRows[0])
  .componentName;
if (!vulnerabilityId || !componentName) {
  throw new Error("The default Runtime list names no vulnerability id or component.");
}
const component = componentName.slice(0, Math.max(3, Math.ceil(componentName.length / 2)));
console.log(`filters taken from the default page: vulnerability id ${vulnerabilityId}, component ${component}`);

const lists = {
  runtimeDefault,
  runtimeSecondPage: await recordList(defectDojo, "runtime second page", runtime({ page: 1 })),
  runtimeWorkloadNamespace: await recordList(
    defectDojo,
    "runtime namespace krci-demo-dev",
    runtime({ workloadNamespace: "krci-demo-dev" })
  ),
  runtimeRemoteCluster: await recordList(
    defectDojo,
    "runtime cluster remote-cluster",
    runtime({ clusters: ["remote-cluster"] })
  ),
  runtimeSeverityCritical: await recordList(defectDojo, "runtime Critical", runtime({ severity: "Critical" })),
  runtimeFalsePositive: await recordList(defectDojo, "runtime false positive", runtime({ state: "falsePositive" })),
  runtimeVulnerabilityId: await recordList(defectDojo, `runtime ${vulnerabilityId}`, runtime({ vulnerabilityId })),
  runtimeComponent: await recordList(defectDojo, `runtime component ${component}`, runtime({ component })),
  runtimeNoMatch: await recordList(defectDojo, "runtime CVE-1999-0001", runtime({ vulnerabilityId: "CVE-1999-0001" })),
  runtimeNoScanData: await recordList(
    defectDojo,
    "runtime cluster no-such-cluster",
    runtime({ clusters: ["no-such-cluster"] })
  ),
  imageDefault: await recordList(defectDojo, "image", { level: "image", namespace: NAMESPACE }),
  imageCodebase: await recordList(defectDojo, "image test-go-app", {
    level: "image",
    namespace: NAMESPACE,
    codebase: "test-go-app",
  }),
  codeDefault: await recordList(defectDojo, "code", { level: "code", namespace: NAMESPACE }),
};

const codebases = (await reader.listResource(k8sCodebaseConfig, NAMESPACE)).items
  .map((item) => (item as KubeObject).metadata.name)
  .sort((a, b) => a.localeCompare(b));

const { notConfigured: notConfiguredClient, unreachable: unreachableClient } = outageClients();

const notConfigured = {
  scope: await recordScope(notConfiguredClient),
  list: await recordList(notConfiguredClient, "not configured", runtime()),
};
const unreachable = {
  scope: await recordScope(unreachableClient),
  list: await recordList(unreachableClient, "unreachable", runtime()),
};
console.log(`not configured scope: ${notConfigured.scope.state}, unreachable scope: ${unreachable.scope.state}`);

const recorded = { scope, codebases, lists, notConfigured, unreachable };

await writeFixtureJson(OUTPUT, recorded, [token, url]);
console.log(`Wrote ${OUTPUT}`);
