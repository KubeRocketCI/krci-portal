/**
 * Records the Storybook data of the codebase "Security Findings" tab from the testbed.
 *
 * Writes apps/client/src/modules/platform/codebases/pages/details/components/SecurityFindingsTab/__fixtures__/testbed.json:
 * the answers of `defectDojo.getCodebaseFindings` and `defectDojo.getScanFindings`, composed by the server code
 * against the live DefectDojo of the testbed and the Codebase, CodebaseBranch, CodebaseImageStream, Stage and
 * Application objects of the namespace krci (a `kubectl get -o json` dump, read through the same code the
 * procedures use).
 *
 * Scenarios: the codebases test-go-app and krci-gitops as the testbed holds them (krci-gitops has no Application,
 * so no Environment); a codebase whose tags DefectDojo does not know (no scan data); DefectDojo not configured;
 * DefectDojo at an address that refuses the connection (unreachable). The DefectDojo address is written as
 * https://defectdojo.example.test in every link.
 * The script fails when the output holds the token or the address it read from.
 *
 * Findings pages recorded, as the tab asks for them:
 * - every scan of a codebase and every running container report (vulnerabilities and secrets): the first page;
 * - test-go-app also: the largest page of findings (`DEFECTDOJO_MAX_PAGE_SIZE`) that "Built vs running" groups by
 *   component, for the own-image CI scans and for the running VulnerabilityReports; for the own Trivy scan the
 *   Critical filter and the triaged findings; krci-gitops: the Critical filter of the own Trivy scan.
 *
 * Run from packages/trpc, with the portal's DefectDojo user (not staff, Product Type KubeRocketCI only):
 *   kubectl -n defectdojo port-forward svc/defectdojo-django <port>:80
 *   kubectl -n krci get codebase,codebasebranch,codebaseimagestream,stages.v2.edp.epam.com,applications.argoproj.io \
 *     -o json > "$TMPDIR/krci-objects.json"
 *   DEFECTDOJO_URL=http://localhost:<port> \
 *   DEFECTDOJO_TOKEN=$(kubectl -n krci get secret krci-portal-defectdojo -o jsonpath='{.data.token}' | base64 -d) \
 *     pnpm exec tsx scripts/record-codebase-findings-fixtures.ts --k8s-file "$TMPDIR/krci-objects.json"
 * The host is localhost: DefectDojo answers 400 to 127.0.0.1.
 */
import { resolve } from "node:path";
import {
  DEFECTDOJO_MAX_PAGE_SIZE,
  runtimeContainerRef,
  scanFindingsInputSchema,
  type CodebaseFindings,
  type CodebaseScan,
  type ScanFindings,
  type ScanFindingsInput,
  type ScanRef,
} from "@my-project/shared";
import { ANSWER_ORIGIN } from "../src/clients/defectDojo/__fixtures__/answers.js";
import { DefectDojoClient } from "../src/clients/defectDojo/index.js";
import { composeCodebaseFindings, readScanFindings } from "../src/routers/defectDojo/codebaseFindings/compose.js";
import { readCodebaseFacts, type CodebaseFacts } from "../src/routers/defectDojo/codebaseFindings/facts.js";
import { outageClients, readRecorderSettings } from "./lib/defectDojoRecorder.js";
import { readKubeObjectsFile } from "./lib/kubeObjects.js";
import { writeFixtureJson } from "./lib/writeFixture.js";

const OUTPUT = resolve(
  "../../apps/client/src/modules/platform/codebases/pages/details/components/SecurityFindingsTab/__fixtures__/testbed.json"
);

const NAMESPACE = "krci";

const { url, token, k8sFile } = readRecorderSettings();
const reader = readKubeObjectsFile(k8sFile);

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

type Page = Omit<ScanFindingsInput, "namespace" | "name" | "scan">;

/** The page that "Built vs running" groups by component. */
const DRILL_DOWN_PAGE: Page = { page: 0, pageSize: DEFECTDOJO_MAX_PAGE_SIZE, showTriaged: false };

/** A scan or a container report that a row opens, and the pages of its findings to record. */
interface OpenedScan {
  ref: ScanRef;
  pages: Page[];
}

interface CodebasePages {
  /** More pages of a CI scan, after its first. */
  ciPages?: (scan: CodebaseScan) => Page[];
  /** The largest page for the own-image CI scans and the running VulnerabilityReports. */
  drillDown?: boolean;
}

function openedScansOf(
  summary: CodebaseFindings,
  { ciPages = () => [], drillDown = false }: CodebasePages
): OpenedScan[] {
  if (summary.state !== "data") {
    return [];
  }

  const { code, image, runtime } = summary.levels;
  const ciScans = [...code.scans, ...image.scans].map((scan) => ({
    ref: scan.ref,
    pages: [{}, ...ciPages(scan), ...(drillDown && scan.ownImage ? [DRILL_DOWN_PAGE] : [])],
  }));

  const containerReports = runtime.environments.flatMap((environment) =>
    environment.containers.flatMap((container): OpenedScan[] => {
      if (container.state !== "running") {
        return [];
      }
      return [
        ...(container.vulnerabilities
          ? [
              {
                ref: runtimeContainerRef(environment, container, "vulnerabilityreport"),
                pages: [{}, ...(drillDown ? [DRILL_DOWN_PAGE] : [])],
              },
            ]
          : []),
        ...(container.secrets
          ? [{ ref: runtimeContainerRef(environment, container, "exposedsecretreport"), pages: [{}] }]
          : []),
      ];
    })
  );

  return [...ciScans, ...containerReports];
}

function describeScan(scan: ScanRef): string {
  return scan.level === "runtime"
    ? `runtime ${scan.cdPipeline}/${scan.stage} ${scan.workload}/${scan.container} ${scan.reportKind}`
    : `${scan.level} ${scan.scanner} ${scan.image ?? ""}`;
}

async function recordScanFindings(facts: CodebaseFacts, input: ScanFindingsInput): Promise<RecordedScanFindings> {
  const output = await readScanFindings(defectDojo, facts, scanFindingsInputSchema.parse(input));
  const rows = output.state === "data" ? ` ${output.findings.length} of ${output.total}` : "";
  console.log(`${describeScan(input.scan)} (page size ${input.pageSize ?? "default"}): ${output.state}${rows}`);
  return { input, output };
}

/** The summary of a codebase and the pages of findings that its rows open. */
async function recordCodebase(name: string, pages: CodebasePages = {}): Promise<RecordedCodebase> {
  const facts = await readCodebaseFacts(reader, { namespace: NAMESPACE, name });
  const summary = await composeCodebaseFindings(defectDojo, facts);
  if (summary.state === "data") {
    const { code, image, runtime } = summary.levels;
    const containers = runtime.environments.flatMap((environment) => environment.containers);
    console.log(
      `${name}: ${summary.state}, ${code.scans.length + image.scans.length} scans, ` +
        `${runtime.environments.length} Environments, ${containers.length} containers (runtime ${runtime.state})`
    );
  } else {
    console.log(`${name}: ${summary.state}`);
  }

  const scanFindings: RecordedScanFindings[] = [];
  for (const { ref, pages: refPages } of openedScansOf(summary, pages)) {
    for (const page of refPages) {
      scanFindings.push(await recordScanFindings(facts, { namespace: NAMESPACE, name, scan: ref, ...page }));
    }
  }
  return { summary, scanFindings };
}

const ownImageTrivy = (scan: CodebaseScan) => scan.ownImage && scan.ref.scanner === "Trivy Scan";

const testGoApp = await recordCodebase("test-go-app", {
  ciPages: (scan) => (ownImageTrivy(scan) ? [{ severity: "Critical" }, { showTriaged: true }] : []),
  drillDown: true,
});
// A filter that matches no finding.
const krciGitops = await recordCodebase("krci-gitops", {
  ciPages: (scan) => (ownImageTrivy(scan) ? [{ severity: "Critical" }] : []),
});

// A codebase whose codebase tag DefectDojo does not hold: the answer names none of its facts.
const noScanData = await composeCodebaseFindings(defectDojo, {
  name: "no-such-app",
  namespace: NAMESPACE,
  defaultBranch: "main",
  branches: ["main"],
  ownImageNames: [],
  environments: [],
});
console.log(`no-such-app: ${noScanData.state}`);

const facts = await readCodebaseFacts(reader, { namespace: NAMESPACE, name: "test-go-app" });
const outage = outageClients();
const notConfigured = await composeCodebaseFindings(outage.notConfigured, facts);
const unreachable = await composeCodebaseFindings(outage.unreachable, facts);
console.log(`not configured: ${notConfigured.state}, unreachable: ${unreachable.state}`);

const recorded = {
  testGoApp,
  krciGitops,
  noScanData: { summary: noScanData, scanFindings: [] },
  notConfigured: { summary: notConfigured, scanFindings: [] },
  unreachable: { summary: unreachable, scanFindings: [] },
};

await writeFixtureJson(OUTPUT, recorded, [token, url]);
console.log(`Wrote ${OUTPUT}`);
