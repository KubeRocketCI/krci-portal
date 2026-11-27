/**
 * Records the Storybook data of the security views of the Stage page from the testbed.
 *
 * Writes apps/client/src/modules/platform/cdpipelines/pages/stage-details/__fixtures__/testbed.json: the answers of
 * `defectDojo.getEnvironmentSummary` for each Stage of the dump, composed by the server code against the live
 * DefectDojo of the testbed and the Stages and Argo CD Applications of the namespace `NAMESPACE` (a
 * `kubectl get -o json` dump, read through the same code the procedure uses). The DefectDojo address is written as
 * `ANSWER_ORIGIN` in every link. The script fails when the output holds the token or the address it read from.
 * Both outages are recorded for the first Stage.
 *
 * Run from packages/trpc, with the portal's DefectDojo user (not staff, Product Type KubeRocketCI only):
 *   kubectl -n defectdojo port-forward svc/defectdojo-django <port>:80
 *   kubectl -n krci get stages.v2.edp.epam.com,applications.argoproj.io -o json > "$TMPDIR/krci-stage-objects.json"
 *   DEFECTDOJO_URL=http://localhost:<port> \
 *   DEFECTDOJO_TOKEN=$(kubectl -n krci get secret krci-portal-defectdojo -o jsonpath='{.data.token}' | base64 -d) \
 *     pnpm exec tsx scripts/record-stage-fixtures.ts --k8s-file "$TMPDIR/krci-stage-objects.json"
 * The host is localhost: DefectDojo answers 400 to 127.0.0.1.
 */
import { resolve } from "node:path";
import type { EnvironmentSummary, EnvironmentSummaryInput } from "@my-project/shared";
import { ANSWER_ORIGIN } from "../src/clients/defectDojo/__fixtures__/answers.js";
import { DefectDojoClient } from "../src/clients/defectDojo/index.js";
import { composeEnvironmentSummary } from "../src/routers/defectDojo/environmentSummary/compose.js";
import { readEnvironmentFacts } from "../src/routers/defectDojo/environmentSummary/facts.js";
import { readPlatformFacts } from "../src/routers/defectDojo/platformFindings/facts.js";
import { outageClients, readRecorderSettings } from "./lib/defectDojoRecorder.js";
import { readKubeObjectsFile } from "./lib/kubeObjects.js";
import { writeFixtureJson } from "./lib/writeFixture.js";

const OUTPUT = resolve(
  "../../apps/client/src/modules/platform/cdpipelines/pages/stage-details/__fixtures__/testbed.json"
);

const NAMESPACE = "krci";

const { url, token, k8sFile } = readRecorderSettings();
const reader = readKubeObjectsFile(k8sFile);
const defectDojo = new DefectDojoClient({ apiBaseURL: url, token, webBaseURL: ANSWER_ORIGIN });
const { notConfigured: notConfiguredClient, unreachable: unreachableClient } = outageClients();

interface Recorded {
  input: EnvironmentSummaryInput;
  output: EnvironmentSummary;
}

function describeSummary(output: EnvironmentSummary): string {
  if (output.state !== "data") {
    return output.state;
  }
  const { runtime, containers, applications } = output;
  const cells = applications?.map(({ codebase, state }) => `${codebase} ${state}`).join(", ") ?? "Applications unknown";
  return `${runtime.state}, ${containers.scanned} containers scanned, ${containers.notRunning} not running; ${cells}`;
}

async function record(source: DefectDojoClient, name: string, input: EnvironmentSummaryInput): Promise<Recorded> {
  const output = await composeEnvironmentSummary(source, await readEnvironmentFacts(reader, input));
  console.log(`${name}: ${describeSummary(output)}`);
  return { input, output };
}

const { stages: platformStages } = await readPlatformFacts(reader, NAMESPACE);
const inputs: EnvironmentSummaryInput[] = platformStages.map(({ cdPipeline, stage }) => ({
  namespace: NAMESPACE,
  cdPipeline,
  stage,
}));
if (inputs.length === 0) {
  throw new Error(`The dump holds no Stage of the namespace ${NAMESPACE}.`);
}

const stages: Record<string, Recorded> = {};
for (const input of inputs) {
  const name = `${input.cdPipeline}/${input.stage}`;
  stages[name] = await record(defectDojo, name, input);
}

const recorded = {
  stages,
  notConfigured: await record(notConfiguredClient, "not configured", inputs[0]),
  unreachable: await record(unreachableClient, "unreachable", inputs[0]),
};

await writeFixtureJson(OUTPUT, recorded, [token, url]);
console.log(`Wrote ${OUTPUT}`);
