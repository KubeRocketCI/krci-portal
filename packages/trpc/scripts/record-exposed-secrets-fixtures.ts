/**
 * Records the Storybook data of the Security > Exposed Secrets page from the testbed.
 *
 * Writes apps/client/src/modules/platform/security/pages/exposed-secrets/__fixtures__/testbed.json: the answers of
 * `defectDojo.getFindingsScope` and `defectDojo.getExposedSecrets`, composed by the server code against the live
 * DefectDojo of the testbed and the Stages, Applications and Codebases of the namespace `NAMESPACE` (a
 * `kubectl get -o json` dump, read through the same code the procedures use). The DefectDojo address is written as
 * `ANSWER_ORIGIN` in every link. The answers are procedure outputs: `description` and `mitigation` of a finding never
 * leave the server, so the recording holds no matched secret text.
 * The script fails when the output holds the token or the address it read from.
 *
 * The page reads two lists, the Code list (Gitleaks scans of the codebases) and the Runtime list (ExposedSecretReports
 * of the running workloads), each recorded under its own name: a story seeds one of each. The scope and both lists are
 * also recorded for DefectDojo not configured and for DefectDojo at an address that refuses the connection
 * (unreachable). The names of the Codebases of the dump fill the codebase select.
 *
 * Run from packages/trpc, with the portal's DefectDojo user (not staff, Product Type KubeRocketCI only):
 *   kubectl -n defectdojo port-forward svc/defectdojo-django <port>:80
 *   kubectl -n krci get stages.v2.edp.epam.com,applications.argoproj.io,codebases.v2.edp.epam.com \
 *     -o json > "$TMPDIR/krci-objects.json"
 *   DEFECTDOJO_URL=http://localhost:<port> \
 *   DEFECTDOJO_TOKEN=$(kubectl -n krci get secret krci-portal-defectdojo -o jsonpath='{.data.token}' | base64 -d) \
 *     pnpm exec tsx scripts/record-exposed-secrets-fixtures.ts --k8s-file "$TMPDIR/krci-objects.json"
 * The host is localhost: DefectDojo answers 400 to 127.0.0.1.
 */
import { resolve } from "node:path";
import { exposedSecretsInputSchema, type ExposedSecretsInput } from "@my-project/shared";
import { ANSWER_ORIGIN } from "../src/clients/defectDojo/__fixtures__/answers.js";
import { DefectDojoClient } from "../src/clients/defectDojo/index.js";
import { readPlatformFacts } from "../src/routers/defectDojo/platformFindings/facts.js";
import { SECRET_LIST } from "../src/routers/defectDojo/platformFindings/list.js";
import {
  outageClients,
  readRecorderSettings,
  recordFindingsScope,
  recordPlatformList,
  type RecordedList,
} from "./lib/defectDojoRecorder.js";
import { readCodebaseNames, readKubeObjectsFile } from "./lib/kubeObjects.js";
import { writeFixtureJson } from "./lib/writeFixture.js";

const OUTPUT = resolve(
  "../../apps/client/src/modules/platform/security/pages/exposed-secrets/__fixtures__/testbed.json"
);

const NAMESPACE = "krci";

const { url, token, k8sFile } = readRecorderSettings();
const reader = readKubeObjectsFile(k8sFile);
const facts = await readPlatformFacts(reader, NAMESPACE, { applications: true });

const defectDojo = new DefectDojoClient({ apiBaseURL: url, token, webBaseURL: ANSWER_ORIGIN });

type CodeInput = Extract<ExposedSecretsInput, { level: "code" }>;
type RuntimeInput = Extract<ExposedSecretsInput, { level: "runtime" }>;

const recordList = (source: DefectDojoClient, name: string, input: ExposedSecretsInput) =>
  recordPlatformList(source, facts, SECRET_LIST, name, exposedSecretsInputSchema.parse(input));

const code = (filters: Omit<CodeInput, "level" | "namespace"> = {}) =>
  ({ level: "code", namespace: NAMESPACE, ...filters }) satisfies ExposedSecretsInput;

const runtime = (filters: Omit<RuntimeInput, "level" | "namespace"> = {}) =>
  ({ level: "runtime", namespace: NAMESPACE, ...filters }) satisfies ExposedSecretsInput;

function totalOf({ output }: RecordedList): number {
  return output.state === "data" ? output.total : 0;
}

function requireFindings(name: string, list: RecordedList): void {
  if (totalOf(list) === 0) {
    throw new Error(`The ${name} list holds no findings: the stories assert on its rows.`);
  }
}

function requireNoScanData(name: string, list: RecordedList): void {
  if (list.output.state !== "noScanData") {
    throw new Error(`The ${name} list must answer no scan data.`);
  }
}

function requireNoMatch(name: string, list: RecordedList): void {
  if (list.output.state !== "data" || list.output.total !== 0) {
    throw new Error(`The ${name} list must answer data with no finding.`);
  }
}

const scope = await recordFindingsScope(defectDojo, facts);
console.log(`scope: ${scope.state}`);

const codeDefault = await recordList(defectDojo, "code default", code());
const runtimeDefault = await recordList(defectDojo, "runtime default", runtime());
requireFindings("default Code", codeDefault);
requireFindings("default Runtime", runtimeDefault);

const CODEBASE = "test-go-app";
const WORKLOAD_CLUSTER = "in-cluster";
const WORKLOAD_NAMESPACE = "krci-demo-dev";
const SEVERITY = "Medium";
const NO_MATCH_SEVERITY = "Critical";
/** A Codebase whose Gitleaks scans hold no active finding. */
const CLEAN_CODEBASE = "krci-gitops";
const NO_SCAN_CODEBASE = "no-such-codebase";

const codeCodebase = await recordList(defectDojo, `code ${CODEBASE}`, code({ codebase: CODEBASE }));
const runtimeClusterNamespace = await recordList(
  defectDojo,
  `runtime ${WORKLOAD_CLUSTER} / ${WORKLOAD_NAMESPACE}`,
  runtime({ clusters: [WORKLOAD_CLUSTER], workloadNamespace: WORKLOAD_NAMESPACE })
);
requireFindings(`Code of ${CODEBASE}`, codeCodebase);
requireFindings("Runtime of the cluster and namespace", runtimeClusterNamespace);

const runtimeSeverity = await recordList(defectDojo, `runtime ${SEVERITY}`, runtime({ severity: SEVERITY }));
requireFindings(`Runtime ${SEVERITY}`, runtimeSeverity);
const codeSeverity = await recordList(defectDojo, `code ${SEVERITY}`, code({ severity: SEVERITY }));

const codeTriaged = await recordList(defectDojo, "code false positive", code({ state: "falsePositive" }));
const runtimeTriaged = await recordList(defectDojo, "runtime false positive", runtime({ state: "falsePositive" }));
requireFindings("false positive Code", codeTriaged);
requireFindings("false positive Runtime", runtimeTriaged);

const lists = {
  codeDefault,
  codeCodebase,
  codeSeverity,
  codeTriaged,
  codeMitigated: await recordList(defectDojo, "code mitigated", code({ state: "mitigated" })),
  codeNoMatch: await recordList(defectDojo, `code ${NO_MATCH_SEVERITY}`, code({ severity: NO_MATCH_SEVERITY })),
  codeNoActive: await recordList(defectDojo, `code ${CLEAN_CODEBASE}`, code({ codebase: CLEAN_CODEBASE })),
  codeNoScanData: await recordList(defectDojo, `code ${NO_SCAN_CODEBASE}`, code({ codebase: NO_SCAN_CODEBASE })),
  runtimeDefault,
  runtimeClusterNamespace,
  runtimeSeverity,
  runtimeTriaged,
  runtimeNoScanData: await recordList(
    defectDojo,
    "runtime cluster no-such-cluster",
    runtime({ clusters: ["no-such-cluster"] })
  ),
  runtimeNoMatch: await recordList(
    defectDojo,
    `runtime ${NO_MATCH_SEVERITY}`,
    runtime({ severity: NO_MATCH_SEVERITY })
  ),
};

requireNoScanData(`Code of ${NO_SCAN_CODEBASE}`, lists.codeNoScanData);
requireNoScanData("Runtime of a cluster without tests", lists.runtimeNoScanData);
requireNoMatch("Code with no match", lists.codeNoMatch);
requireNoMatch(`Code of ${CLEAN_CODEBASE}`, lists.codeNoActive);
requireNoMatch("Runtime with no match", lists.runtimeNoMatch);

const codebases = await readCodebaseNames(reader, NAMESPACE);

const { notConfigured: notConfiguredClient, unreachable: unreachableClient } = outageClients();

async function recordOutage(source: DefectDojoClient, name: string) {
  return {
    scope: await recordFindingsScope(source, facts),
    code: await recordList(source, `${name} code`, code()),
    runtime: await recordList(source, `${name} runtime`, runtime()),
  };
}

const notConfigured = await recordOutage(notConfiguredClient, "not configured");
const unreachable = await recordOutage(unreachableClient, "unreachable");
console.log(`not configured scope: ${notConfigured.scope.state}, unreachable scope: ${unreachable.scope.state}`);

const recorded = { scope, codebases, lists, notConfigured, unreachable };

await writeFixtureJson(OUTPUT, recorded, [token, url]);
console.log(`Wrote ${OUTPUT}`);
