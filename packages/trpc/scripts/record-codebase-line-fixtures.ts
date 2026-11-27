/**
 * Records the Storybook data of the security line of the codebase Overview tab from the testbed.
 *
 * Writes apps/client/src/modules/platform/codebases/pages/details/components/Overview/__fixtures__/testbed.json: the
 * answers of `defectDojo.getCodebaseSecurityLine` for every Codebase of the namespace krci, composed by the server code
 * against the live DefectDojo of the testbed and the Codebase, CodebaseBranch, CodebaseImageStream, Stage and
 * Application objects of that namespace (a `kubectl get -o json` dump, read through the same code the procedure uses);
 * then DefectDojo not configured and DefectDojo at an address that refuses the connection, for the first Codebase.
 * The script fails when the output holds the token or the address it read from.
 * The story NotRunning reads the Codebase line-fixture, which the testbed lacks: add it to the dump with a
 * CodebaseBranch and an Application of demo / dev, and give DefectDojo runtime tests with the `app` tag of that
 * Application, all closed (empty `build_id`).
 *
 * Run from packages/trpc, with the portal's DefectDojo user (not staff, Product Type KubeRocketCI only):
 *   kubectl -n defectdojo port-forward svc/defectdojo-django <port>:80
 *   kubectl -n krci get codebase,codebasebranch,codebaseimagestream,stages.v2.edp.epam.com,applications.argoproj.io \
 *     -o json > "$TMPDIR/krci-objects.json"
 *   DEFECTDOJO_URL=http://localhost:<port> \
 *   DEFECTDOJO_TOKEN=$(kubectl -n krci get secret krci-portal-defectdojo -o jsonpath='{.data.token}' | base64 -d) \
 *     pnpm exec tsx scripts/record-codebase-line-fixtures.ts --k8s-file "$TMPDIR/krci-objects.json"
 * The host is localhost: DefectDojo answers 400 to 127.0.0.1.
 */
import { resolve } from "node:path";
import type { CodebaseSecurityLine } from "@my-project/shared";
import { DefectDojoClient } from "../src/clients/defectDojo/index.js";
import { readCodebaseFacts } from "../src/routers/defectDojo/codebaseFindings/facts.js";
import { composeCodebaseSecurityLine } from "../src/routers/defectDojo/codebaseFindings/line.js";
import { outageClients, readRecorderSettings } from "./lib/defectDojoRecorder.js";
import { readCodebaseNames, readKubeObjectsFile } from "./lib/kubeObjects.js";
import { writeFixtureJson } from "./lib/writeFixture.js";

const OUTPUT = resolve(
  "../../apps/client/src/modules/platform/codebases/pages/details/components/Overview/__fixtures__/testbed.json"
);

const NAMESPACE = "krci";

const { url, token, k8sFile } = readRecorderSettings();
const reader = readKubeObjectsFile(k8sFile);
const defectDojo = new DefectDojoClient({ apiBaseURL: url, token });

function describeLine(line: CodebaseSecurityLine): string {
  if (line.state !== "data") {
    return line.state;
  }
  return Object.entries(line.levels)
    .map(([level, phrase]) =>
      phrase.state === "data" ? `${level} ${phrase.severity} ${phrase.count}` : `${level} ${phrase.state}`
    )
    .join(", ");
}

const factsOf = await Promise.all(
  (await readCodebaseNames(reader, NAMESPACE)).map((name) => readCodebaseFacts(reader, { namespace: NAMESPACE, name }))
);

const codebases: Record<string, CodebaseSecurityLine> = {};
for (const facts of factsOf) {
  codebases[facts.name] = await composeCodebaseSecurityLine(defectDojo, facts);
  console.log(`${facts.name}: ${describeLine(codebases[facts.name])}`);
}

const outage = outageClients();
const recorded = {
  codebases,
  notConfigured: await composeCodebaseSecurityLine(outage.notConfigured, factsOf[0]),
  unreachable: await composeCodebaseSecurityLine(outage.unreachable, factsOf[0]),
};
console.log(`not configured: ${recorded.notConfigured.state}, unreachable: ${recorded.unreachable.state}`);

await writeFixtureJson(OUTPUT, recorded, [token, url]);
console.log(`Wrote ${OUTPUT}`);
