// PROTOTYPE (EPMDEDP-16072): throwaway DefectDojo read path. Not for main.
// No caching, no retries. Every procedure answers with one of four states.
import {
  PROTOTYPE_DEFECTDOJO_SCAN_TYPE_LEVEL,
  PROTOTYPE_RUNTIME_SECRET_FINDING_TITLE,
  prototypeDefectDojoCountsResultSchema,
  prototypeDefectDojoFindingsResultSchema,
  prototypeDefectDojoListFindingsInputSchema,
  prototypeDefectDojoListProductsInputSchema,
  prototypeDefectDojoListTestsInputSchema,
  prototypeDefectDojoProductSetCountsInputSchema,
  prototypeDefectDojoProductSetCountsResultSchema,
  prototypeDefectDojoProductsResultSchema,
  prototypeDefectDojoSeverityCountsInputSchema,
  prototypeDefectDojoSeveritySchema,
  prototypeDefectDojoTestsResultSchema,
  prototypeRuntimeReportKind,
  type PrototypeDefectDojoFinding,
  type PrototypeDefectDojoScopeCounts,
  type PrototypeDefectDojoSeverityCounts,
  type PrototypeDefectDojoTest,
} from "@my-project/shared";
import { t } from "../../trpc.js";
import { protectedProcedure } from "../../procedures/protected/index.js";
import {
  joinTags,
  loadPrototypeDefectDojoConfig,
  PrototypeDefectDojoClient,
  PrototypeDefectDojoUnreachableError,
  type DefectDojoRawCounts,
  type DefectDojoRawEngagement,
  type DefectDojoRawFinding,
  type DefectDojoRawTest,
} from "../../clients/prototypeDefectDojo/index.js";

type StateResult<T> =
  | { state: "notConfigured" }
  | { state: "unreachable"; requests: string[] }
  | { state: "noData"; requests: string[] }
  | { state: "data"; requests: string[]; data: T };

/** `read` returns `null` for "no data". */
async function readWithStates<T>(
  read: (client: PrototypeDefectDojoClient) => Promise<T | null>
): Promise<StateResult<T>> {
  const config = loadPrototypeDefectDojoConfig();
  if (!config) {
    return { state: "notConfigured" };
  }

  const client = new PrototypeDefectDojoClient(config);
  try {
    const data = await read(client);
    if (data === null) {
      return { state: "noData", requests: client.requests };
    }
    return { state: "data", requests: client.requests, data };
  } catch (error) {
    if (error instanceof PrototypeDefectDojoUnreachableError) {
      console.error(`[DefectDojo prototype] ${error.message}`);
      return { state: "unreachable", requests: client.requests };
    }
    throw error;
  }
}

function toSeverityCounts(raw: DefectDojoRawCounts): PrototypeDefectDojoSeverityCounts {
  return {
    critical: raw.severity.Critical,
    high: raw.severity.High,
    medium: raw.severity.Medium,
    low: raw.severity.Low,
    info: raw.severity.Info,
    total: raw.total,
  };
}

function toTest(raw: DefectDojoRawTest, engagement: DefectDojoRawEngagement, webURL: string): PrototypeDefectDojoTest {
  const title = raw.title || raw.scan_type;
  const level = PROTOTYPE_DEFECTDOJO_SCAN_TYPE_LEVEL[raw.scan_type] ?? null;

  return {
    id: raw.id,
    title,
    scanType: raw.scan_type,
    level,
    reportKind: level === "runtime" ? prototypeRuntimeReportKind({ title, tags: raw.tags }) : null,
    branchTag: raw.branch_tag ?? "",
    version: raw.version ?? "",
    buildId: raw.build_id ?? "",
    tags: raw.tags,
    created: raw.created,
    updated: raw.updated,
    url: `${webURL}/test/${raw.id}`,
    engagement: {
      id: engagement.id,
      name: engagement.name,
      url: `${webURL}/engagement/${engagement.id}`,
    },
    product: {
      id: engagement.product.id,
      name: engagement.product.name,
      url: `${webURL}/asset/${engagement.product.id}`,
    },
  };
}

/** Maps the allow-listed fields only. `description` and `mitigation` are never copied. */
function toFinding(
  raw: DefectDojoRawFinding,
  test: PrototypeDefectDojoTest | null,
  webURL: string
): PrototypeDefectDojoFinding {
  const severity = prototypeDefectDojoSeveritySchema.safeParse(raw.severity);

  return {
    id: raw.id,
    testId: raw.test,
    test,
    title: raw.title,
    severity: severity.success ? severity.data : "Info",
    active: raw.active,
    verified: raw.verified,
    falsePositive: raw.false_p,
    outOfScope: raw.out_of_scope,
    riskAccepted: raw.risk_accepted,
    duplicate: raw.duplicate,
    mitigated: raw.is_mitigated,
    underReview: raw.under_review,
    date: raw.date,
    created: raw.created,
    updated: raw.updated,
    mitigatedAt: raw.mitigated,
    componentName: raw.component_name,
    componentVersion: raw.component_version,
    vulnerabilityIds: (raw.vulnerability_ids ?? []).map((item) => item.vulnerability_id),
    cwe: raw.cwe || null,
    cvssv3Score: raw.cvssv3_score,
    epssScore: raw.epss_score,
    knownExploited: raw.known_exploited ?? false,
    filePath: raw.file_path,
    line: raw.line,
    service: raw.service,
    fixAvailable: raw.fix_available,
    fixVersion: raw.fix_version,
    slaDaysRemaining: raw.sla_days_remaining,
    tags: raw.tags ?? [],
    url: `${webURL}/finding/${raw.id}`,
  };
}

/** Products that carry every tag of `tags`, limited to the configured Product Type. */
const listProducts = protectedProcedure
  .input(prototypeDefectDojoListProductsInputSchema)
  .output(prototypeDefectDojoProductsResultSchema)
  .query(({ input }) =>
    readWithStates(async (client) => {
      const page = await client.listProducts(input.tags);
      const productTypes = page.prefetch?.prod_type ?? {};

      const products = page.results
        .filter((product) => productTypes[String(product.prod_type)]?.name === client.config.productType)
        .map((product) => ({
          id: product.id,
          name: product.name,
          tags: product.tags,
          url: `${client.config.webURL}/asset/${product.id}`,
        }));

      return products.length > 0 ? products : null;
    })
  );

/** Tests that carry every tag, with engagement and product resolved, limited to the configured Product Type. */
const listTests = protectedProcedure
  .input(prototypeDefectDojoListTestsInputSchema)
  .output(prototypeDefectDojoTestsResultSchema)
  .query(({ input }) =>
    readWithStates(async (client) => {
      const page = await client.listTests(input.tags);
      const engagements = page.prefetch?.engagement ?? {};
      const { webURL, productType } = client.config;

      const tests: PrototypeDefectDojoTest[] = [];
      for (const test of page.results) {
        const engagement = engagements[String(test.engagement)];
        if (engagement && engagement.product.prod_type.name === productType) {
          tests.push(toTest(test, engagement, webURL));
        }
      }

      return tests.length > 0 ? tests : null;
    })
  );

/** Active findings by severity for each test id and product id. One API v3 request per id, two with `withInactive`. */
const severityCounts = protectedProcedure
  .input(prototypeDefectDojoSeverityCountsInputSchema)
  .output(prototypeDefectDojoCountsResultSchema)
  .query(({ input }) =>
    readWithStates(async (client) => {
      const scopes = [
        ...input.testIds.map((id) => ({ scope: "test" as const, id })),
        ...input.productIds.map((id) => ({ scope: "product" as const, id })),
      ];
      if (scopes.length === 0) {
        return null;
      }

      return Promise.all(
        scopes.map(async ({ scope, id }): Promise<PrototypeDefectDojoScopeCounts> => {
          const [active, all] = await Promise.all([
            client.countFindings(scope, [id], true),
            input.withInactive ? client.countFindings(scope, [id], false) : null,
          ]);

          return {
            scope,
            id,
            active: toSeverityCounts(active),
            inactiveTotal: all ? all.total - all.active : null,
          };
        })
      );
    })
  );

/** Active findings by severity of a set of products together. One API v3 request, two with `withInactive`. */
const productSetCounts = protectedProcedure
  .input(prototypeDefectDojoProductSetCountsInputSchema)
  .output(prototypeDefectDojoProductSetCountsResultSchema)
  .query(({ input }) =>
    readWithStates(async (client) => {
      const [active, all] = await Promise.all([
        client.countFindings("productSet", input.productIds, true),
        input.withInactive ? client.countFindings("productSet", input.productIds, false) : null,
      ]);

      return {
        active: toSeverityCounts(active),
        inactiveTotal: all ? all.total - all.active : null,
      };
    })
  );

/** One page of findings, most severe first. Zero findings is `data`, not `noData`. */
const listFindings = protectedProcedure
  .input(prototypeDefectDojoListFindingsInputSchema)
  .output(prototypeDefectDojoFindingsResultSchema)
  .query(({ input }) =>
    readWithStates(async (client) => {
      let testTypeId: number | undefined;
      if (input.scanType) {
        const found = await client.findTestTypeId(input.scanType);
        if (found === null) {
          // No test of that scan type was ever imported.
          return { count: 0, findings: [] };
        }
        testTypeId = found;
      }

      const page = await client.listFindings(
        {
          test: input.testId,
          test__engagement__product: input.productId,
          test__engagement__product__tags__and: joinTags(input.productTagsAll),
          test__engagement__product__tags: joinTags(input.productTagsAny),
          test__tags__and: joinTags(input.testTagsAll),
          test__test_type: testTypeId,
          title: input.runtimeSecretsOnly ? PROTOTYPE_RUNTIME_SECRET_FINDING_TITLE : undefined,
          vulnerability_id: input.vulnerabilityId,
          component_name: input.componentName,
          limit: input.limit,
          offset: input.offset,
          severity: input.severity,
          active: input.active,
          false_p: input.falsePositive,
          out_of_scope: input.outOfScope,
          is_mitigated: input.mitigated,
          duplicate: input.duplicate,
          risk_accepted: input.riskAccepted,
        },
        input.withTest
      );

      const rawTests = page.prefetch?.test ?? {};
      const { webURL } = client.config;

      return {
        count: page.count,
        findings: page.results.map((finding) => {
          const rawTest = rawTests[String(finding.test)];
          const engagement = finding.related_fields?.test?.engagement;
          const test = rawTest && engagement ? toTest(rawTest, engagement, webURL) : null;
          return toFinding(finding, test, webURL);
        }),
      };
    })
  );

export const prototypeDefectDojoRouter = t.router({
  listProducts,
  listTests,
  severityCounts,
  productSetCounts,
  listFindings,
});
