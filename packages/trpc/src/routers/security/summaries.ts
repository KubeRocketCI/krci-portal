import type {
  SecurityCiSummary,
  SecurityCodebaseSummary,
  SecurityEnvironmentApplication,
  SecurityEnvironmentOther,
  SecurityEnvironmentSummary,
  SecurityFinding,
  SecurityFindingsPage,
  SecurityListFindingsInput,
  SecurityRuntimeSummary,
} from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import {
  toSecuritySeverity,
  workloadsOf,
  type DefectDojoClient,
  type DefectDojoFinding,
  type DefectDojoFindingsFilter,
  type DefectDojoTest,
} from "../../clients/defectdojo/index.js";
import type { AuthorizedStage } from "./authorization.js";
import {
  countFindingRows,
  firstNonEmpty,
  latestVersionOf,
  listCiEngagements,
  loadClassifiedEngagements,
  sortedCopy,
  toolsOf,
  updatedOf,
  versionsOf,
} from "./engagements.js";
import {
  classifyTests,
  codebaseFindingsFilter,
  engagementIdsOf,
  environmentName,
  loadNamespaceRuntimes,
  namespaceLink,
  otherFindingsFilter,
  resolveEnvironmentTarget,
  resolveEnvironmentTargets,
  testsRunningImages,
  workloadsOfTests,
  type NamespaceRuntime,
  type RuntimeContext,
  type RuntimeInput,
} from "./runtime.js";

/** The runtime tests of one codebase in the namespace of one environment. */
interface CodebaseNamespace {
  namespace: NamespaceRuntime;
  tests: DefectDojoTest[];
}

/**
 * The namespaces of the environments of the codebase, ordered by environment, with the tests that run an image
 * of the codebase. A namespace without such a test is left out.
 */
async function loadCodebaseNamespaces(
  client: DefectDojoClient,
  codebase: string,
  runtime: RuntimeInput
): Promise<CodebaseNamespace[]> {
  const imageTags = runtime.images?.get(codebase);
  if (!imageTags) {
    return [];
  }

  const targets = resolveEnvironmentTargets(runtime.stages, client);
  const namespaces = await loadNamespaceRuntimes(client, targets, runtime.tenantTags);

  return namespaces.flatMap((namespace) => {
    const tests = testsRunningImages(namespace.tests, imageTags);
    return tests.length > 0 ? [{ namespace, tests }] : [];
  });
}

/** CI scans and runtime scans of one codebase. */
export async function getCodebaseSummary(
  client: DefectDojoClient,
  codebase: string,
  runtime: RuntimeInput
): Promise<SecurityCodebaseSummary> {
  const product = await client.getProductByName(codebase);
  const classified = product ? await loadClassifiedEngagements(client, product.id) : [];
  const codebaseNamespaces = await loadCodebaseNamespaces(client, codebase, runtime);

  if (classified.length === 0 && codebaseNamespaces.length === 0) {
    return { status: "NONE", codebase, ci: [], runtime: [] };
  }

  const counts = await countFindingRows(client, [
    ...classified.map(({ engagement }) => ({ engagementIds: [engagement.id] })),
    ...codebaseNamespaces.map(({ tests }) => codebaseFindingsFilter(tests, runtime.tenantTags)),
  ]);

  const ci: SecurityCiSummary[] = classified.map(({ engagement, tests, kind }, index) => {
    const row = {
      tools: toolsOf(tests),
      counts: counts[index],
      updated: updatedOf(tests),
      link: client.engagementUrl(engagement.id),
    };

    return kind.kind === "code"
      ? { kind: "code", engagement: engagement.name, branch: kind.branch, ...row }
      : { kind: "image", engagement: engagement.name, image: kind.image, tag: latestVersionOf(tests), ...row };
  });

  const runtimeRows: SecurityRuntimeSummary[] = codebaseNamespaces.map(({ namespace, tests }, index) => ({
    environment: namespace.target.environment,
    workloads: workloadsOfTests(tests),
    versions: versionsOf(tests),
    tools: toolsOf(tests),
    counts: counts[classified.length + index],
    updated: updatedOf(tests),
    link: namespaceLink(client, namespace),
  }));

  return {
    status: "OK",
    codebase,
    ci: sortedCopy(ci, (item) => item.engagement),
    runtime: runtimeRows,
    link: product ? client.productUrl(product.id) : undefined,
  };
}

/** The runtime scans of one environment, per application. */
export async function getEnvironmentSummary(
  client: DefectDojoClient,
  stage: AuthorizedStage,
  runtime: RuntimeContext
): Promise<SecurityEnvironmentSummary> {
  const environment = environmentName(stage);
  const none: SecurityEnvironmentSummary = { status: "NONE", environment, applications: [] };

  const target = resolveEnvironmentTarget(stage, client);
  if (!target || !runtime.images) {
    return none;
  }

  const [namespace] = await loadNamespaceRuntimes(client, [target], runtime.tenantTags);
  if (!namespace) {
    return none;
  }

  const { byCodebase, other } = classifyTests(namespace.tests, runtime.images);
  const codebases = sortedCopy([...byCodebase], ([codebase]) => codebase);
  const codebaseTests = codebases.flatMap(([, tests]) => tests);

  const counts = await countFindingRows(client, [
    ...codebases.map(([, tests]) => codebaseFindingsFilter(tests, runtime.tenantTags)),
    ...(other.length > 0 ? [otherFindingsFilter(other, codebaseTests, runtime.tenantTags)] : []),
  ]);

  const link = namespaceLink(client, namespace);

  const applications: SecurityEnvironmentApplication[] = codebases.map(([codebase, tests], index) => ({
    codebase,
    workloads: workloadsOfTests(tests),
    versions: versionsOf(tests),
    counts: counts[index],
    updated: updatedOf(tests),
    link,
  }));

  const otherRow: SecurityEnvironmentOther | undefined =
    other.length > 0
      ? { counts: counts[codebases.length], workloads: workloadsOfTests(other), updated: updatedOf(other), link }
      : undefined;

  return { status: "OK", environment, applications, other: otherRow };
}

type FindingOrigin =
  | { scope: "ci"; engagement: string; branch?: string }
  | { scope: "runtime"; engagement: string; environment: string };

/** One page of the CI findings of a codebase, most severe first. */
export async function getCiFindingsPage(
  client: DefectDojoClient,
  input: SecurityListFindingsInput
): Promise<SecurityFindingsPage> {
  if (input.environment) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "environment applies to runtime findings only" });
  }

  const product = await client.getProductByName(input.codebase);
  const selected = product ? await listCiEngagements(client, product.id) : [];

  const origins = new Map<number, FindingOrigin>(
    selected.map(({ engagement, kind }) => [
      engagement.id,
      { scope: "ci", engagement: engagement.name, branch: kind.kind === "code" ? kind.branch : undefined },
    ])
  );

  return findingsPage(client, input, { engagementIds: [...origins.keys()] }, origins);
}

/** One page of the runtime findings of a codebase, most severe first, from the environments of `runtime`. */
export async function getRuntimeFindingsPage(
  client: DefectDojoClient,
  input: SecurityListFindingsInput,
  runtime: RuntimeInput
): Promise<SecurityFindingsPage> {
  const { codebase, environment } = input;

  const stages =
    environment === undefined
      ? runtime.stages
      : runtime.stages.filter((stage) => environmentName(stage) === environment);
  const codebaseNamespaces = await loadCodebaseNamespaces(client, codebase, { ...runtime, stages });

  // Two Stages on one namespace share its engagement; the first environment by name owns it.
  const origins = new Map<number, FindingOrigin>();
  for (const { namespace, tests } of codebaseNamespaces) {
    for (const engagementId of engagementIdsOf(tests)) {
      const engagement = namespace.engagements.get(engagementId);
      if (engagement && !origins.has(engagementId)) {
        origins.set(engagementId, {
          scope: "runtime",
          engagement: engagement.name,
          environment: namespace.target.environment,
        });
      }
    }
  }

  const filter = codebaseFindingsFilter(
    codebaseNamespaces.flatMap(({ tests }) => tests),
    runtime.tenantTags
  );

  return findingsPage(client, input, filter, origins);
}

/** The requested page of the findings of `filter`; NONE when there are no engagements to read. */
async function findingsPage(
  client: DefectDojoClient,
  { severity, page, pageSize }: SecurityListFindingsInput,
  filter: DefectDojoFindingsFilter,
  origins: ReadonlyMap<number, FindingOrigin>
): Promise<SecurityFindingsPage> {
  if (filter.engagementIds.length === 0) {
    return { status: "NONE", items: [], totalCount: 0, page, pageSize };
  }

  const result = await client.listFindings(
    { ...filter, severities: severity },
    { offset: (page - 1) * pageSize, limit: pageSize }
  );

  const items = result.findings.map((finding) => {
    const test = result.tests.get(finding.test);
    const origin = test && origins.get(test.engagement);
    if (!test || !origin) {
      throw new Error(
        `Finding ${finding.id} belongs to test ${finding.test}, which is outside the requested engagements`
      );
    }

    return toSecurityFinding(client, finding, test, origin);
  });

  return { status: "OK", items, totalCount: result.totalCount, page, pageSize };
}

function toSecurityFinding(
  client: DefectDojoClient,
  finding: DefectDojoFinding,
  test: DefectDojoTest,
  origin: FindingOrigin
): SecurityFinding {
  return {
    id: finding.id,
    severity: toSecuritySeverity(finding.severity),
    title: finding.title,
    vulnId: firstNonEmpty(finding.vulnerability_ids?.[0]?.vulnerability_id),
    component: firstNonEmpty(finding.component_name, finding.file_path) ?? "",
    version: finding.component_version ?? "",
    fixedVersion: fixedVersionOf(finding),
    scope: origin.scope,
    environment: origin.scope === "runtime" ? origin.environment : undefined,
    workload: origin.scope === "runtime" ? workloadsOf(test.tags)[0] : undefined,
    branch: origin.scope === "ci" ? origin.branch : undefined,
    engagement: origin.engagement,
    link: client.findingUrl(finding.id),
  };
}

/** `fix_version`, or the `mitigation` of a finding whose scanner reports a fix (Trivy writes the fixed version there). */
function fixedVersionOf(finding: DefectDojoFinding): string | undefined {
  return firstNonEmpty(finding.fix_version, finding.fix_available ? finding.mitigation : undefined);
}
