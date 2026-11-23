/**
 * Records the Storybook data of the codebase "Security Findings" tab from the testbed.
 *
 * Writes apps/client/src/modules/platform/codebases/pages/details/components/SecurityFindingsTab/__fixtures__/testbed.json:
 * the answers of `defectDojo.getCodebaseFindings` and `defectDojo.getScanFindings`, composed by the server code
 * against the live DefectDojo of the testbed and the Codebase, CodebaseBranch and CodebaseImageStream objects of the
 * namespace krci (a `kubectl get -o json` dump, read through the same code the procedures use).
 *
 * Scenarios: the codebases test-go-app and krci-gitops as the testbed holds them; a codebase whose tags
 * DefectDojo does not know (no scan data); DefectDojo not configured; DefectDojo at an address that refuses the
 * connection (unreachable). The DefectDojo address is written as https://defectdojo.example.test in every link.
 * The script fails when the output holds the token or the address it read from.
 *
 * Run from packages/trpc, with the portal's DefectDojo user (not staff, Product Type KubeRocketCI only):
 *   kubectl -n defectdojo port-forward svc/defectdojo-django <port>:80
 *   kubectl -n krci get codebase,codebasebranch,codebaseimagestream -o json > "$TMPDIR/krci-objects.json"
 *   DEFECTDOJO_URL=http://localhost:<port> \
 *   DEFECTDOJO_TOKEN=$(kubectl -n krci get secret krci-portal-defectdojo -o jsonpath='{.data.token}' | base64 -d) \
 *     pnpm exec tsx scripts/record-codebase-findings-fixtures.ts --k8s-file "$TMPDIR/krci-objects.json"
 * The host is localhost: DefectDojo answers 400 to 127.0.0.1.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  scanFindingsInputSchema,
  stripTrailingSlash,
  type CodebaseFindings,
  type CodebaseScan,
  type ScanFindings,
  type ScanFindingsInput,
} from "@my-project/shared";
import { format, resolveConfig } from "prettier";
import { ANSWER_ORIGIN } from "../src/clients/defectDojo/__fixtures__/answers.js";
import { DefectDojoClient } from "../src/clients/defectDojo/index.js";
import { composeCodebaseFindings, readScanFindings } from "../src/routers/defectDojo/codebaseFindings/compose.js";
import { readCodebaseFacts, type CodebaseFacts } from "../src/routers/defectDojo/codebaseFindings/facts.js";
import { createKubeReader, type KubeObject } from "../src/routers/defectDojo/__fixtures__/kubeReader.js";

const OUTPUT = resolve(
  "../../apps/client/src/modules/platform/codebases/pages/details/components/SecurityFindingsTab/__fixtures__/testbed.json"
);

const NAMESPACE = "krci";

const { values } = parseArgs({ options: { "k8s-file": { type: "string" } } });
const url = stripTrailingSlash(process.env.DEFECTDOJO_URL);
const token = process.env.DEFECTDOJO_TOKEN;
if (!url || !token || !values["k8s-file"]) {
  console.error("Set DEFECTDOJO_URL and DEFECTDOJO_TOKEN and pass --k8s-file (see the header of this file).");
  process.exit(2);
}

const objects: { items: KubeObject[] } = JSON.parse(readFileSync(values["k8s-file"], "utf8"));
const reader = createKubeReader(objects.items);

const defectDojo = new DefectDojoClient({ apiBaseURL: url, token, webBaseURL: ANSWER_ORIGIN });

/** One page of findings that the tab can open, with the input that asks for it. */
interface RecordedScanFindings {
  input: ScanFindingsInput;
  output: ScanFindings;
}

interface RecordedCodebase {
  summary: CodebaseFindings;
  scanFindings: RecordedScanFindings[];
}

const scansOf = (summary: CodebaseFindings): CodebaseScan[] =>
  summary.state === "data" ? [...summary.levels.code.scans, ...summary.levels.image.scans] : [];

async function recordScanFindings(facts: CodebaseFacts, input: ScanFindingsInput): Promise<RecordedScanFindings> {
  const output = await readScanFindings(defectDojo, facts, scanFindingsInputSchema.parse(input));
  console.log(`${input.scan.level} ${input.scan.scanner} ${input.scan.image ?? ""}: ${output.state}`);
  return { input, output };
}

/** The summary of a codebase and the first page of the findings of each of its scans. */
async function recordCodebase(
  name: string,
  extraPages: (scan: CodebaseScan) => Omit<ScanFindingsInput, "namespace" | "name" | "scan">[] = () => []
): Promise<RecordedCodebase> {
  const facts = await readCodebaseFacts(reader, { namespace: NAMESPACE, name });
  const summary = await composeCodebaseFindings(defectDojo, facts);
  console.log(`${name}: ${summary.state}, ${scansOf(summary).length} scans`);

  const scanFindings: RecordedScanFindings[] = [];
  for (const scan of scansOf(summary)) {
    for (const page of [{}, ...extraPages(scan)]) {
      scanFindings.push(await recordScanFindings(facts, { namespace: NAMESPACE, name, scan: scan.ref, ...page }));
    }
  }
  return { summary, scanFindings };
}

const ownImageScan = (scan: CodebaseScan) => scan.ownImage && scan.ref.scanner === "Trivy Scan";

const testGoApp = await recordCodebase("test-go-app", (scan) =>
  ownImageScan(scan) ? [{ severity: "Critical" }, { showTriaged: true }] : []
);
// A filter that matches no finding.
const krciGitops = await recordCodebase("krci-gitops", (scan) =>
  ownImageScan(scan) ? [{ severity: "Critical" }] : []
);

// A codebase whose codebase tag DefectDojo does not hold: the answer names none of its facts.
const noScanData = await composeCodebaseFindings(defectDojo, {
  name: "no-such-app",
  namespace: NAMESPACE,
  branches: ["main"],
  ownImageNames: [],
});
console.log(`no-such-app: ${noScanData.state}`);

const facts = await readCodebaseFacts(reader, { namespace: NAMESPACE, name: "test-go-app" });
const notConfigured = await composeCodebaseFindings(new DefectDojoClient({ apiBaseURL: "", token: "" }), facts);
const unreachable = await composeCodebaseFindings(
  new DefectDojoClient({ apiBaseURL: "http://127.0.0.1:1", token: "not-a-token", timeoutMs: 2000 }),
  facts
);
console.log(`not configured: ${notConfigured.state}, unreachable: ${unreachable.state}`);

const recorded = {
  testGoApp,
  krciGitops,
  noScanData: { summary: noScanData, scanFindings: [] },
  notConfigured: { summary: notConfigured, scanFindings: [] },
  unreachable: { summary: unreachable, scanFindings: [] },
};

const json = `${JSON.stringify(recorded, null, 2)}\n`;
for (const secret of [token, url]) {
  if (json.includes(secret)) {
    throw new Error("The output holds the token or the address of DefectDojo.");
  }
}
mkdirSync(dirname(OUTPUT), { recursive: true });
// plugins: [] overrides the client prettier plugin; trpc does not resolve it.
writeFileSync(OUTPUT, await format(json, { ...(await resolveConfig(OUTPUT)), plugins: [], filepath: OUTPUT }));
console.log(`Wrote ${OUTPUT}`);
