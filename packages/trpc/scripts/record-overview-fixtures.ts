/**
 * Records the Storybook data of the Security > Overview page from the testbed.
 *
 * Writes apps/client/src/modules/platform/security/pages/overview/__fixtures__/testbed.json: the answers of
 * `defectDojo.getSecurityOverview` and `defectDojo.getSecurityOverviewCodebases`, composed by the server code against
 * the live DefectDojo of the testbed and the Stages, Codebases, CodebaseBranches and CodebaseImageStreams of the
 * namespace `NAMESPACE` (a `kubectl get -o json` dump, read through the same code the procedures use). The DefectDojo
 * address is written as `ANSWER_ORIGIN` in every link.
 * The script fails when the output holds the token or the address it read from.
 *
 * The Runtime part is recorded for the states Active and False positive; the Codebases part for those and for
 * Mitigated, under which the page asks for no Runtime part. Both parts are also recorded for DefectDojo not configured
 * and for DefectDojo at an address that refuses the connection (unreachable).
 *
 * Run from packages/trpc, with the portal's DefectDojo user (not staff, Product Type KubeRocketCI only):
 *   kubectl -n defectdojo port-forward svc/defectdojo-django <port>:80
 *   kubectl -n krci get stages.v2.edp.epam.com,codebases.v2.edp.epam.com,codebasebranches.v2.edp.epam.com,codebaseimagestreams.v2.edp.epam.com \
 *     -o json > "$TMPDIR/krci-objects.json"
 *   DEFECTDOJO_URL=http://localhost:<port> \
 *   DEFECTDOJO_TOKEN=$(kubectl -n krci get secret krci-portal-defectdojo -o jsonpath='{.data.token}' | base64 -d) \
 *     pnpm exec tsx scripts/record-overview-fixtures.ts --k8s-file "$TMPDIR/krci-objects.json"
 * The host is localhost: DefectDojo answers 400 to 127.0.0.1.
 */
import { resolve } from "node:path";
import {
  securityOverviewCodebasesInputSchema,
  securityOverviewInputSchema,
  type SecurityOverview,
  type SecurityOverviewCodebases,
  type SecurityOverviewCodebasesRequest,
  type SecurityOverviewRequest,
} from "@my-project/shared";
import { ANSWER_ORIGIN } from "../src/clients/defectDojo/__fixtures__/answers.js";
import { DefectDojoClient } from "../src/clients/defectDojo/index.js";
import { readPlatformFacts } from "../src/routers/defectDojo/platformFindings/facts.js";
import {
  loadCodebasesPart,
  toSecurityOverviewCodebases,
} from "../src/routers/defectDojo/securityOverview/codebases.js";
import { loadRuntimePart, toSecurityOverview } from "../src/routers/defectDojo/securityOverview/namespaces.js";
import { readTenantFacts } from "../src/routers/defectDojo/securityOverview/tenantFacts.js";
import { outageClients, readRecorderSettings } from "./lib/defectDojoRecorder.js";
import { readKubeObjectsFile } from "./lib/kubeObjects.js";
import { writeFixtureJson } from "./lib/writeFixture.js";

const OUTPUT = resolve("../../apps/client/src/modules/platform/security/pages/overview/__fixtures__/testbed.json");

const NAMESPACE = "krci";

const { url, token, k8sFile } = readRecorderSettings();
const reader = readKubeObjectsFile(k8sFile);
const platformFacts = await readPlatformFacts(reader, NAMESPACE);
const tenantFacts = await readTenantFacts(reader, NAMESPACE);

const defectDojo = new DefectDojoClient({ apiBaseURL: url, token, webBaseURL: ANSWER_ORIGIN });
const { notConfigured: notConfiguredClient, unreachable: unreachableClient } = outageClients();

interface RecordedRuntime {
  input: SecurityOverviewRequest;
  output: SecurityOverview;
}

interface RecordedCodebases {
  input: SecurityOverviewCodebasesRequest;
  output: SecurityOverviewCodebases;
}

function describeRuntime(output: SecurityOverview): string {
  return output.state === "data" ? `data, ${output.namespaces.length} namespaces` : output.state;
}

function describeCodebases(output: SecurityOverviewCodebases): string {
  switch (output.state) {
    case "data":
      return `data, ${output.codebases.length} codebases with scans, ${output.unscanned.length} without`;
    case "noScanData":
      return `noScanData, ${output.unscanned.length} Codebases without a CI test`;
    default:
      return output.state;
  }
}

/** Reads the Runtime part as `getSecurityOverview` does. */
async function recordRuntime(
  source: DefectDojoClient,
  name: string,
  state: SecurityOverviewRequest["state"]
): Promise<RecordedRuntime> {
  const input = securityOverviewInputSchema.parse({ namespace: NAMESPACE, state });
  const output = toSecurityOverview(platformFacts, await loadRuntimePart(source, input.state), input.namespace);

  console.log(`${name}: ${describeRuntime(output)}`);
  return { input, output };
}

/** Reads the Codebases part as `getSecurityOverviewCodebases` does. */
async function recordCodebases(
  source: DefectDojoClient,
  name: string,
  state: SecurityOverviewCodebasesRequest["state"]
): Promise<RecordedCodebases> {
  const input = securityOverviewCodebasesInputSchema.parse({ namespace: NAMESPACE, state });
  const output = toSecurityOverviewCodebases(
    tenantFacts,
    await loadCodebasesPart(source, input.namespace, input.state)
  );

  console.log(`${name}: ${describeCodebases(output)}`);
  return { input, output };
}

function requireData(name: string, { output }: RecordedRuntime | RecordedCodebases): void {
  if (output.state !== "data") {
    throw new Error(`The ${name} part holds no data: the stories assert on its rows.`);
  }
}

const runtime = {
  active: await recordRuntime(defectDojo, "runtime active", "active"),
  falsePositive: await recordRuntime(defectDojo, "runtime false positive", "falsePositive"),
};
const codebases = {
  active: await recordCodebases(defectDojo, "codebases active", "active"),
  falsePositive: await recordCodebases(defectDojo, "codebases false positive", "falsePositive"),
  mitigated: await recordCodebases(defectDojo, "codebases mitigated", "mitigated"),
};

requireData("active Runtime", runtime.active);
requireData("false positive Runtime", runtime.falsePositive);
requireData("active Codebases", codebases.active);
requireData("false positive Codebases", codebases.falsePositive);
requireData("mitigated Codebases", codebases.mitigated);

async function recordOutage(source: DefectDojoClient, name: string) {
  return {
    runtime: await recordRuntime(source, `${name} runtime`, "active"),
    codebases: await recordCodebases(source, `${name} codebases`, "active"),
  };
}

const notConfigured = await recordOutage(notConfiguredClient, "not configured");
const unreachable = await recordOutage(unreachableClient, "unreachable");

const recorded = { runtime, codebases, notConfigured, unreachable };

await writeFixtureJson(OUTPUT, recorded, [token, url]);
console.log(`Wrote ${OUTPUT}`);
