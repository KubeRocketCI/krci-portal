import { stripTrailingSlash, type SecuritySeverity } from "@my-project/shared";
import type { ZodType } from "zod";
import { TtlCache } from "../../utils/ttlCache/index.js";
import { createHttpService, notConfiguredError, type HttpService } from "../http/index.js";
import {
  DEFECTDOJO_API_VERSION,
  DEFECTDOJO_SERVICE_NAME,
  DEFECTDOJO_SEVERITY_LABELS,
  SECURITY_SEVERITY_BY_DEFECTDOJO_LABEL,
  LIST_MAX_PAGES,
  LIST_PAGE_SIZE,
} from "./constants.js";
import {
  defectDojoCountPageSchema,
  defectDojoEngagementsPageSchema,
  defectDojoFindingSeveritiesPageSchema,
  defectDojoFindingsPageSchema,
  defectDojoProductsPageSchema,
  defectDojoTestsPageSchema,
  type DefectDojoEngagement,
  type DefectDojoFinding,
  type DefectDojoPrefetchedEngagement,
  type DefectDojoProduct,
  type DefectDojoTest,
} from "./schemas.js";

export * from "./constants.js";
export type {
  DefectDojoEngagement,
  DefectDojoFinding,
  DefectDojoPrefetchedEngagement,
  DefectDojoProduct,
  DefectDojoTest,
} from "./schemas.js";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT_MS = 30_000;

const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 500;

// =============================================================================
// Configuration
// =============================================================================

interface DefectDojoConfig {
  apiBaseURL: string;
  apiKey: string;
  webBaseURL: string;
  timeoutMs: number;
}

/**
 * Load DefectDojo configuration from environment.
 * Called once at module load time.
 */
function loadConfig(): DefectDojoConfig {
  return {
    apiBaseURL: process.env.DEFECTDOJO_URL || "",
    apiKey: process.env.DEFECTDOJO_API_KEY || "",
    webBaseURL: process.env.DEFECTDOJO_WEB_URL || "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

// Load config once at module initialization
const config = loadConfig();

/**
 * Responses are shared by all callers for a short time, so the cache lives at module level.
 * Procedures read it only after the caller is authorized.
 */
const sharedCache = new TtlCache({ ttlMs: CACHE_TTL_MS, maxEntries: CACHE_MAX_ENTRIES });

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a DefectDojoClient instance.
 *
 * @returns Configured DefectDojoClient instance
 * @throws TRPCError if DEFECTDOJO_URL, DEFECTDOJO_API_KEY or DEFECTDOJO_WEB_URL is not configured
 */
export function createDefectDojoClient(): DefectDojoClient {
  if (!config.apiBaseURL) {
    throw notConfiguredError(DEFECTDOJO_SERVICE_NAME, "DEFECTDOJO_URL");
  }

  if (!config.apiKey) {
    throw notConfiguredError(DEFECTDOJO_SERVICE_NAME, "DEFECTDOJO_API_KEY");
  }

  if (!config.webBaseURL) {
    throw notConfiguredError(DEFECTDOJO_SERVICE_NAME, "DEFECTDOJO_WEB_URL");
  }

  return new DefectDojoClient({
    apiBaseURL: config.apiBaseURL,
    apiKey: config.apiKey,
    webBaseURL: config.webBaseURL,
    timeoutMs: config.timeoutMs,
    cache: sharedCache,
  });
}

// =============================================================================
// Client
// =============================================================================

export interface DefectDojoClientConfig {
  apiBaseURL: string;
  apiKey: string;
  /** Base of the links to the DefectDojo web UI. */
  webBaseURL: string;
  timeoutMs?: number;
  /** Defaults to a cache of its own. */
  cache?: TtlCache;
}

/** Findings of the engagements `engagementIds` that are active and not duplicates. */
export interface DefectDojoFindingsFilter {
  engagementIds: number[];
  severities?: SecuritySeverity[];
  /** Tags every test of the findings carries, e.g. `krci-tenant:<namespace>` and `krci-env:<cdPipeline>.<stage>`. */
  testTags?: string[];
}

export interface DefectDojoTestsResult {
  tests: DefectDojoTest[];
  /** The engagements of `tests` with their product, by engagement id. */
  engagements: Map<number, DefectDojoPrefetchedEngagement>;
}

export interface DefectDojoFindingSeverities {
  /** Findings of the filter, including those beyond `limit`. */
  count: number;
  /** DefectDojo severity names of the first `limit` findings. */
  severities: string[];
}

export interface DefectDojoFindingsResult {
  totalCount: number;
  findings: DefectDojoFinding[];
  /** The tests of `findings`, by test id. */
  tests: Map<number, DefectDojoTest>;
}

type Query = Record<string, string | number | boolean | undefined>;

/**
 * Client for the DefectDojo API v2. Authenticates with an API token in the `Authorization` header.
 * Responses are cached for a short time and concurrent identical requests share one call.
 */
export class DefectDojoClient {
  private readonly http: HttpService;
  private readonly cache: TtlCache;
  private readonly webBaseURL: string;

  constructor(clientConfig: DefectDojoClientConfig) {
    const { apiBaseURL, apiKey, webBaseURL, timeoutMs = DEFAULT_TIMEOUT_MS, cache } = clientConfig;

    if (!apiBaseURL) {
      throw new Error(`${DEFECTDOJO_SERVICE_NAME} API base URL is not configured`);
    }

    if (!apiKey) {
      throw new Error(`${DEFECTDOJO_SERVICE_NAME} API key is not configured`);
    }

    if (!webBaseURL) {
      throw new Error(`${DEFECTDOJO_SERVICE_NAME} web base URL is not configured`);
    }

    this.webBaseURL = stripTrailingSlash(webBaseURL);
    this.cache = cache ?? new TtlCache({ ttlMs: CACHE_TTL_MS, maxEntries: CACHE_MAX_ENTRIES });
    this.http = createHttpService({
      name: DEFECTDOJO_SERVICE_NAME,
      baseURL: `${stripTrailingSlash(apiBaseURL)}/api/${DEFECTDOJO_API_VERSION}`,
      timeoutMs,
      headers: { Authorization: `Token ${apiKey}` },
    });
  }

  productUrl(productId: number): string {
    return `${this.webBaseURL}/product/${productId}`;
  }

  engagementUrl(engagementId: number): string {
    return `${this.webBaseURL}/engagement/${engagementId}`;
  }

  findingUrl(findingId: number): string {
    return `${this.webBaseURL}/finding/${findingId}`;
  }

  /** The product with exactly this name, or null. Product names are unique in DefectDojo. */
  async getProductByName(name: string): Promise<DefectDojoProduct | null> {
    const page = await this.get("/products/", { name_exact: name, limit: 2 }, defectDojoProductsPageSchema);
    return page.results.find((product) => product.name === name) ?? null;
  }

  async listEngagements(productId: number): Promise<DefectDojoEngagement[]> {
    const pages = await this.listPages("/engagements/", { product: productId }, defectDojoEngagementsPageSchema);
    return pages.flatMap((page) => page.results);
  }

  async listTestsByEngagement(engagementId: number): Promise<DefectDojoTestsResult> {
    return this.listTests({ engagement: engagementId });
  }

  /** The tests that carry every tag of `tags`. */
  async listTestsByTags(tags: string[]): Promise<DefectDojoTestsResult> {
    return this.listTests({ tags__and: tags.join(",") });
  }

  /** Number of findings of `filter`. */
  async countFindings(filter: DefectDojoFindingsFilter): Promise<number> {
    const page = await this.get("/findings/", { ...findingsQuery(filter), limit: 1 }, defectDojoCountPageSchema);
    return page.count;
  }

  /** Number of findings of `filter` and the severity of its first `limit` findings, in one request. */
  async listFindingSeverities(filter: DefectDojoFindingsFilter, limit: number): Promise<DefectDojoFindingSeverities> {
    const page = await this.get(
      "/findings/",
      { ...findingsQuery(filter), limit },
      defectDojoFindingSeveritiesPageSchema
    );
    return { count: page.count, severities: page.results.map((finding) => finding.severity) };
  }

  /** One page of the findings of `filter`, most severe first. */
  async listFindings(
    filter: DefectDojoFindingsFilter,
    paging: { offset: number; limit: number }
  ): Promise<DefectDojoFindingsResult> {
    const page = await this.get(
      "/findings/",
      {
        ...findingsQuery(filter),
        ordering: "numerical_severity,id",
        prefetch: "test",
        limit: paging.limit,
        offset: paging.offset,
      },
      defectDojoFindingsPageSchema
    );

    return {
      totalCount: page.count,
      findings: page.results,
      tests: new Map(Object.values(page.prefetch?.test ?? {}).map((test) => [test.id, test])),
    };
  }

  private async listTests(filter: Query): Promise<DefectDojoTestsResult> {
    const pages = await this.listPages("/tests/", { ...filter, prefetch: "engagement" }, defectDojoTestsPageSchema);

    return {
      tests: pages.flatMap((page) => page.results),
      engagements: new Map(
        pages
          .flatMap((page) => Object.values(page.prefetch?.engagement ?? {}))
          .map((engagement) => [engagement.id, engagement])
      ),
    };
  }

  /** Reads a list page by page until `count` rows are read or `LIST_MAX_PAGES` pages are; warns when rows remain. */
  private async listPages<Page extends { count: number }>(
    path: string,
    query: Query,
    schema: ZodType<Page>
  ): Promise<Page[]> {
    const pages: Page[] = [];

    while (pages.length < LIST_MAX_PAGES) {
      const offset = pages.length * LIST_PAGE_SIZE;
      const page = await this.get(path, { ...query, limit: LIST_PAGE_SIZE, offset }, schema);
      pages.push(page);

      if (pages.length * LIST_PAGE_SIZE >= page.count) {
        break;
      }

      if (pages.length === LIST_MAX_PAGES) {
        console.warn(
          `[${DEFECTDOJO_SERVICE_NAME}] ${path} list cut at ${LIST_MAX_PAGES} pages: ${pages.length * LIST_PAGE_SIZE} of ${page.count} rows read`
        );
      }
    }

    return pages;
  }

  private get<T>(path: string, query: Query, schema: ZodType<T>): Promise<T> {
    const key = `${path}?${new URLSearchParams(sortedEntries(query))}`;
    return this.cache.getOrLoad(key, () => this.http.json(path, { query, schema }));
  }
}

function findingsQuery(filter: DefectDojoFindingsFilter): Query {
  // DefectDojo ignores an empty filter and answers with every finding.
  if (filter.engagementIds.length === 0) {
    throw new Error("A findings query needs at least one engagement");
  }

  return {
    test__engagement: filter.engagementIds.join(","),
    test__tags__and: filter.testTags?.length ? filter.testTags.join(",") : undefined,
    severity: filter.severities?.length
      ? filter.severities.map((severity) => DEFECTDOJO_SEVERITY_LABELS[severity]).join(",")
      : undefined,
    active: true,
    duplicate: false,
  };
}

function sortedEntries(query: Query): [string, string][] {
  return Object.entries(query)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .map(([key, value]): [string, string] => [key, String(value)])
    .sort(([a], [b]) => a.localeCompare(b));
}

/** Portal severity of a DefectDojo severity name. An unknown name is `unassigned`. */
export function toSecuritySeverity(label: string): SecuritySeverity {
  return SECURITY_SEVERITY_BY_DEFECTDOJO_LABEL[label] ?? "unassigned";
}
