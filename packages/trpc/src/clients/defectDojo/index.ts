import { stripTrailingSlash } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { ZodError, type ZodType, type ZodTypeAny } from "zod";
import { TtlCache } from "../../utils/ttlCache/index.js";
import { createHttpService, HttpError, HttpStatusError, type HttpService } from "../http/index.js";
import { loadDefectDojoConfig } from "./config.js";
import {
  DEFAULT_PRODUCT_TYPE,
  DEFECTDOJO_SERVICE_NAME,
  DEFECTDOJO_TIMEOUT_MS,
  FINDINGS_MAX_PAGE_SIZE,
  LIST_PAGE_SIZE,
  TEST_TYPE_CACHE_MAX_ENTRIES,
  TEST_TYPE_CACHE_TTL_MS,
  levelOfScanType,
} from "./constants.js";
import {
  countsRequest,
  findingsRequest,
  productsRequest,
  testRequest,
  testsRequest,
  testTypeRequest,
  toTagFilter,
  type DefectDojoRequest,
  type ListPage,
} from "./requests.js";
import {
  countsAnswerSchema,
  findingsPageSchema,
  listPageSchema,
  productRowSchema,
  productTypeRefSchema,
  testEngagementSchema,
  testRowSchema,
  testSchema,
  testTypesPageSchema,
  type FindingRow,
  type TestEngagement,
  type TestRow,
} from "./schemas.js";
import type {
  DefectDojoClientConfig,
  DefectDojoFinding,
  DefectDojoFindingsPage,
  DefectDojoFindingsQuery,
  DefectDojoProduct,
  DefectDojoResult,
  DefectDojoScope,
  DefectDojoSeverityCounts,
  DefectDojoTest,
  DefectDojoTestsFilter,
} from "./types.js";

export * from "./constants.js";
export * from "./types.js";
export { isDefectDojoConfigured } from "./config.js";

/**
 * Test type ids by DefectDojo address and scan type. One lookup serves every client until it expires.
 * A scan type without a test type is not kept: a scan of it may be imported at any time.
 */
const testTypeIdCache = new TtlCache<number>({
  ttlMs: TEST_TYPE_CACHE_TTL_MS,
  maxEntries: TEST_TYPE_CACHE_MAX_ENTRIES,
});

class TestTypeNotFound extends Error {}

/** @internal Forgets the cached test type ids, for tests. */
export function resetTestTypeCache(): void {
  testTypeIdCache.clear();
}

/** A request that `fetch` refused to build. Carries no text: the message of the refusal quotes the settings. */
class InvalidRequest extends Error {
  constructor() {
    super("the request cannot be built from the settings");
  }
}

/**
 * Creates the client of the environment. Without `DEFECTDOJO_URL` or `DEFECTDOJO_TOKEN` the client answers every
 * call with `notConfigured`.
 */
export function createDefectDojoClient(env: NodeJS.ProcessEnv = process.env): DefectDojoClient {
  return new DefectDojoClient(loadDefectDojoConfig(env) ?? { apiBaseURL: "", token: "" });
}

/**
 * Read-only client of DefectDojo: API v2 for lists and filters, API v3 for severity counts.
 * Sends GET requests only, with the token of the portal's user.
 *
 * Every call answers with a `DefectDojoResult`: `notConfigured`, `unreachable`, `noScanData` or `data`.
 */
export class DefectDojoClient {
  private readonly http: HttpService | null;
  private readonly apiBaseURL: string;
  private readonly webBaseURL: string;
  private readonly productType: string;
  private readonly listPageSize: number;

  constructor(config: DefectDojoClientConfig) {
    const apiBaseURL = stripTrailingSlash(config.apiBaseURL);

    this.apiBaseURL = apiBaseURL;
    this.http =
      apiBaseURL && config.token
        ? createHttpService({
            name: DEFECTDOJO_SERVICE_NAME,
            baseURL: apiBaseURL,
            timeoutMs: config.timeoutMs ?? DEFECTDOJO_TIMEOUT_MS,
            headers: { Authorization: `Token ${config.token}` },
          })
        : null;
    this.webBaseURL = stripTrailingSlash(config.webBaseURL) || apiBaseURL;
    this.productType = config.productType || DEFAULT_PRODUCT_TYPE;
    this.listPageSize = config.listPageSize ?? LIST_PAGE_SIZE;
  }

  /** Products that carry every one of `tags`, of the configured Product Type. Tags are lower-cased. */
  listProducts(tags: readonly string[]): Promise<DefectDojoResult<DefectDojoProduct[]>> {
    return this.run<DefectDojoProduct[]>(async (http) => {
      const tagFilter = toTagFilter(tags);
      if (tagFilter === null) {
        return { state: "noScanData" };
      }

      const { rows, related: productTypes } = await this.readAll(
        http,
        (page) => productsRequest(tagFilter, page),
        productRowSchema,
        { field: "prod_type", schema: productTypeRefSchema }
      );

      const products = rows
        .filter((product) => productTypes[String(product.prod_type)]?.name === this.productType)
        .map((product) => ({
          id: product.id,
          name: product.name,
          tags: product.tags,
          url: this.url("asset", product.id),
        }));

      return products.length > 0 ? { state: "data", data: products } : { state: "noScanData" };
    });
  }

  /**
   * Tests that carry every one of `filter.tags`, of the configured Product Type, with their engagement and product.
   * Tags are lower-cased; `branchTag` and `scanType` match exactly.
   */
  listTests(filter: DefectDojoTestsFilter): Promise<DefectDojoResult<DefectDojoTest[]>> {
    return this.run<DefectDojoTest[]>(async (http) => {
      const tagFilter = toTagFilter(filter.tags);
      // The transport drops an empty value, so tests of every branch or scan type would match.
      if (tagFilter === null || [filter.branchTag, filter.scanType].some((value) => value === "")) {
        return { state: "noScanData" };
      }

      const { rows, related: engagements } = await this.readAll(
        http,
        (page) => testsRequest({ tagFilter, branchTag: filter.branchTag, scanType: filter.scanType }, page),
        testRowSchema,
        { field: "engagement", schema: testEngagementSchema }
      );

      const tests = rows.flatMap((test) => {
        const engagement = engagements[String(test.engagement)];
        return engagement?.product.prod_type.name === this.productType ? [this.toTest(test, engagement)] : [];
      });

      return tests.length > 0 ? { state: "data", data: tests } : { state: "noScanData" };
    });
  }

  /**
   * Findings of a set of products or of one test, counted by severity in one request (API v3), duplicates left out.
   * `activeOnly` defaults to true; `false` counts the findings of every state, `active` stays the active ones.
   * `activeOnly: false` also counts the findings of closed runtime tests: a close mitigates them. Pages count the
   * active findings.
   *
   * `noScanData`: an empty set of products, or a test that does not exist. A test or product without findings
   * counts zero. DefectDojo answers zero for an unknown id as well, so a test with no finding is looked up.
   */
  getSeverityCounts(
    scope: DefectDojoScope,
    options: { activeOnly?: boolean } = {}
  ): Promise<DefectDojoResult<DefectDojoSeverityCounts>> {
    return this.run<DefectDojoSeverityCounts>(async (http) => {
      if (hasNoProducts(scope)) {
        return { state: "noScanData" };
      }

      const answer = await this.get(http, countsRequest(scope, options.activeOnly ?? true), countsAnswerSchema);
      const counts = answer.meta.counts;

      if ("testId" in scope && counts.total === 0 && !(await this.testExists(http, scope.testId))) {
        return { state: "noScanData" };
      }

      return { state: "data", data: counts };
    });
  }

  /**
   * One page of the findings of a set of products or of one test, most severe first, with the allow-listed fields.
   * Duplicates are not listed; `state` defaults to `active`. A page has at most 100 rows.
   *
   * `scanTypes` selects findings by the test type of their test, looked up once and cached: DefectDojo ignores a
   * filter by scan type name. The ids of `scope` come from `listProducts` and `listTests`, which keep the Product Type.
   * `noScanData`: no set of products, a test that does not exist, or no test type for any of the scan types.
   */
  listFindings(query: DefectDojoFindingsQuery): Promise<DefectDojoResult<DefectDojoFindingsPage>> {
    return this.run<DefectDojoFindingsPage>(async (http) => {
      if (hasNoProducts(query.scope)) {
        return { state: "noScanData" };
      }

      const scanTypes = [...new Set(query.scanTypes ?? [])];
      const found = await Promise.all(scanTypes.map((scanType) => this.findTestTypeId(http, scanType)));
      const testTypeIds = found.filter((id): id is number => id !== null);
      if (scanTypes.length > 0 && testTypeIds.length === 0) {
        return { state: "noScanData" };
      }

      const request = findingsRequest({
        scope: query.scope,
        state: query.state ?? "active",
        severities: query.severities ?? [],
        testTypeIds,
        vulnerabilityId: query.vulnerabilityId,
        component: query.component,
        limit: Math.min(Math.max(query.limit ?? FINDINGS_MAX_PAGE_SIZE, 1), FINDINGS_MAX_PAGE_SIZE),
        offset: Math.max(query.offset ?? 0, 0),
      });

      let page;
      try {
        page = await this.get(http, request, findingsPageSchema);
      } catch (error) {
        if ("testId" in query.scope && isUnknownTest(error)) {
          return { state: "noScanData" };
        }
        throw error;
      }

      return { state: "data", data: { total: page.count, findings: page.results.map((row) => this.toFinding(row)) } };
    });
  }

  private toTest(test: TestRow, engagement: TestEngagement): DefectDojoTest {
    const level = levelOfScanType(test.scan_type);
    const buildId = test.build_id ?? "";

    return {
      id: test.id,
      title: test.title ?? test.scan_type,
      scanType: test.scan_type,
      level,
      branchTag: test.branch_tag ?? "",
      commitHash: test.commit_hash ?? "",
      version: test.version ?? "",
      buildId,
      closed: level === "runtime" && buildId === "",
      tags: test.tags,
      created: test.created,
      updated: test.updated,
      url: this.url("test", test.id),
      engagement: { id: engagement.id, name: engagement.name, url: this.url("engagement", engagement.id) },
      product: {
        id: engagement.product.id,
        name: engagement.product.name,
        url: this.url("asset", engagement.product.id),
      },
    };
  }

  /** Copies the fields of the allow-list. Nothing else of the row is passed on. */
  private toFinding(row: FindingRow): DefectDojoFinding {
    const { test } = row.related_fields;

    return {
      id: row.id,
      title: row.title,
      severity: row.severity,
      active: row.active,
      verified: row.verified,
      duplicate: row.duplicate,
      falsePositive: row.false_p,
      outOfScope: row.out_of_scope,
      riskAccepted: row.risk_accepted,
      mitigated: row.is_mitigated,
      underReview: row.under_review,
      date: row.date ?? null,
      created: row.created ?? null,
      updated: row.updated ?? null,
      mitigatedAt: row.mitigated ?? null,
      componentName: row.component_name ?? null,
      componentVersion: row.component_version ?? null,
      vulnerabilityIds: (row.vulnerability_ids ?? []).map((item) => item.vulnerability_id),
      filePath: row.file_path ?? null,
      line: row.line ?? null,
      service: row.service ?? null,
      fixAvailable: row.fix_available ?? null,
      fixVersion: row.fix_version ?? null,
      url: this.url("finding", row.id),
      test: { id: test.id, url: this.url("test", test.id) },
      engagement: { id: test.engagement.id, url: this.url("engagement", test.engagement.id) },
      product: { id: test.engagement.product.id, url: this.url("asset", test.engagement.product.id) },
    };
  }

  /** Id of the test type of a scan type, or `null` when DefectDojo has none. */
  private async findTestTypeId(http: HttpService, scanType: string): Promise<number | null> {
    try {
      return await testTypeIdCache.getOrLoad(`${this.apiBaseURL}\n${scanType}`, async () => {
        const page = await this.get(http, testTypeRequest(scanType), testTypesPageSchema);
        const testType = page.results.find((candidate) => candidate.name === scanType);
        if (!testType) {
          // A rejected load is not cached.
          throw new TestTypeNotFound();
        }
        return testType.id;
      });
    } catch (error) {
      if (error instanceof TestTypeNotFound) {
        return null;
      }
      throw error;
    }
  }

  private async testExists(http: HttpService, testId: number): Promise<boolean> {
    try {
      await this.get(http, testRequest(testId), testSchema);
      return true;
    } catch (error) {
      if (error instanceof HttpStatusError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Runs a read and maps its failures to a state.
   *
   * A timeout, a refused or dropped connection, a request that cannot be built from the settings and any non-2xx
   * answer (a rejected token included) are `unreachable`. Any other failure throws a generic error. Nothing of a
   * failure reaches the browser. The server log names it; for a non-2xx answer the shared HTTP client also logs
   * the URL and the body.
   */
  private async run<T>(read: (http: HttpService) => Promise<DefectDojoResult<T>>): Promise<DefectDojoResult<T>> {
    if (!this.http) {
      return { state: "notConfigured" };
    }

    try {
      return await read(this.http);
    } catch (error) {
      if (error instanceof HttpError || error instanceof InvalidRequest) {
        console.error(`[${DEFECTDOJO_SERVICE_NAME}] unreachable: ${describeFailure(error)}`);
        return { state: "unreachable" };
      }

      const unexpectedAnswer = error instanceof ZodError || error instanceof SyntaxError;
      console.error(`[${DEFECTDOJO_SERVICE_NAME}] ${unexpectedAnswer ? "unexpected answer" : "read failed"}:`, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `${DEFECTDOJO_SERVICE_NAME} ${unexpectedAnswer ? "returned an unexpected answer" : "read failed"}`,
        cause: error,
      });
    }
  }

  /**
   * One GET request. `fetch` builds the URL and the headers from the settings: a bad address or token makes it
   * throw a TypeError that quotes them, so the TypeError is replaced by an error without text.
   */
  private async get<T>(http: HttpService, { path, query }: DefectDojoRequest, schema: ZodType<T>): Promise<T> {
    try {
      return await http.json(path, { query, schema });
    } catch (error) {
      throw error instanceof TypeError ? new InvalidRequest() : error;
    }
  }

  /**
   * Reads a list page by page until every row is read. The requests are ordered, so pages do not overlap; a row
   * that still comes twice is kept once. `related` holds the objects of the prefetch field of every page by id.
   */
  private async readAll<RowSchema extends ZodType<{ id: number }>, RelatedSchema extends ZodTypeAny>(
    http: HttpService,
    request: (page: ListPage) => DefectDojoRequest,
    rowSchema: RowSchema,
    prefetch: { field: string; schema: RelatedSchema }
  ): Promise<{ rows: RowSchema["_output"][]; related: Record<string, RelatedSchema["_output"]> }> {
    const pageSchema = listPageSchema(rowSchema, prefetch.field, prefetch.schema);
    const rows = new Map<number, RowSchema["_output"]>();
    const related: Record<string, RelatedSchema["_output"]> = {};
    let rowsRead = 0;

    for (;;) {
      const page = await this.get(http, request({ limit: this.listPageSize, offset: rowsRead }), pageSchema);
      for (const row of page.results) {
        rows.set(row.id, row);
      }
      Object.assign(related, page.prefetch?.[prefetch.field]);
      rowsRead += page.results.length;

      if (page.results.length === 0 || rowsRead >= page.count) {
        return { rows: [...rows.values()], related };
      }
    }
  }

  private url(kind: "asset" | "test" | "engagement" | "finding", id: number): string {
    return `${this.webBaseURL}/${kind}/${id}`;
  }
}

/** An empty set of products: DefectDojo would answer with the findings of every product. */
function hasNoProducts(scope: DefectDojoScope): boolean {
  return "productIds" in scope && scope.productIds.length === 0;
}

/** DefectDojo answers 400 with a `test` entry to a test id that does not exist. */
function isUnknownTest(error: unknown): boolean {
  if (!(error instanceof HttpStatusError) || error.status !== 400) {
    return false;
  }
  try {
    return Array.isArray((JSON.parse(error.body) as { test?: unknown } | null)?.test);
  } catch {
    return false;
  }
}

/** The message of a transport failure and the code of the system error under it, such as ECONNREFUSED. */
function describeFailure(error: Error): string {
  const code = ((error.cause as Error | undefined)?.cause as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? `${error.message} (${code})` : error.message;
}
