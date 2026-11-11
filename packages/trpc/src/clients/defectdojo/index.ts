import { inClusterName, isDnsLabel, stripTrailingSlash, type SecuritySeverity } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import type { ZodType } from "zod";
import { tektonInputSchemas } from "../../schemas/tektonInput.js";
import { TtlCache } from "../../utils/ttlCache/index.js";
import { createHttpService, notConfiguredError, type HttpService } from "../http/index.js";
import {
  DEFECTDOJO_API_VERSION,
  DEFECTDOJO_SERVICE_NAME,
  DEFECTDOJO_SEVERITY_LABELS,
  SECURITY_SEVERITY_BY_DEFECTDOJO_LABEL,
  LIST_MAX_PAGES,
  LIST_PAGE_SIZE,
  TRIVY_OPERATOR_ENGAGEMENT,
} from "./constants.js";
import { clusterTag, namespaceLabelTag, namespaceTag } from "./tags.js";
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
export * from "./tags.js";
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
  /** Empty while DEFECTDOJO_CLUSTER_NAME is not set. */
  clusterName: string;
  /** Empty while DEFECTDOJO_TENANT_LABEL is not set. */
  tenantLabel: string;
}

/** Reads the DefectDojo configuration from the environment. */
function loadConfig(): DefectDojoConfig {
  return {
    apiBaseURL: process.env.DEFECTDOJO_URL ?? "",
    apiKey: process.env.DEFECTDOJO_API_KEY ?? "",
    webBaseURL: process.env.DEFECTDOJO_WEB_URL ?? "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
    clusterName: process.env.DEFECTDOJO_CLUSTER_NAME?.trim() ?? "",
    tenantLabel: process.env.DEFECTDOJO_TENANT_LABEL?.trim() ?? "",
  };
}

// Load config once at module initialization
const config = loadConfig();

let warnedAboutClusterName = false;

function invalidSettingError(envVar: string, expected: string): TRPCError {
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `${envVar} environment variable must be ${expected}`,
  });
}

/** Throws what `createDefectDojoClient` throws when a setting is missing or invalid. */
function validateConfig(settings: DefectDojoConfig): void {
  if (!settings.apiBaseURL) {
    throw notConfiguredError(DEFECTDOJO_SERVICE_NAME, "DEFECTDOJO_URL");
  }

  if (!settings.apiKey) {
    throw notConfiguredError(DEFECTDOJO_SERVICE_NAME, "DEFECTDOJO_API_KEY");
  }

  if (!settings.webBaseURL) {
    throw notConfiguredError(DEFECTDOJO_SERVICE_NAME, "DEFECTDOJO_WEB_URL");
  }

  if (settings.clusterName && !isDnsLabel(settings.clusterName)) {
    throw invalidSettingError("DEFECTDOJO_CLUSTER_NAME", "a lowercase DNS label");
  }

  if (settings.tenantLabel && !tektonInputSchemas.k8sLabelKey.safeParse(settings.tenantLabel).success) {
    throw invalidSettingError("DEFECTDOJO_TENANT_LABEL", "a Kubernetes label key");
  }
}

/** Whether DefectDojo is configured and its settings are valid, so that `createDefectDojoClient` succeeds. */
export function isDefectDojoUsable(): boolean {
  try {
    validateConfig(loadConfig());
    return true;
  } catch {
    return false;
  }
}

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
 * @throws TRPCError if DEFECTDOJO_URL, DEFECTDOJO_API_KEY or DEFECTDOJO_WEB_URL is not configured,
 * or if DEFECTDOJO_CLUSTER_NAME or DEFECTDOJO_TENANT_LABEL holds an invalid value
 */
export function createDefectDojoClient(): DefectDojoClient {
  validateConfig(config);

  const clusterName = config.clusterName || inClusterName;

  if (!config.clusterName && !warnedAboutClusterName) {
    warnedAboutClusterName = true;
    console.warn(
      `[${DEFECTDOJO_SERVICE_NAME}] DEFECTDOJO_CLUSTER_NAME is not set; the environments of this cluster are read from the products "${inClusterName}/<namespace>". Set it to the clusterName of the krci-security-operator of this cluster.`
    );
  }

  return new DefectDojoClient({
    apiBaseURL: config.apiBaseURL,
    apiKey: config.apiKey,
    webBaseURL: config.webBaseURL,
    timeoutMs: config.timeoutMs,
    cache: sharedCache,
    clusterName,
    tenantLabel: config.tenantLabel,
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
  /** Cluster name of the portal's own cluster in the names of the namespace products. Defaults to `in-cluster`. */
  clusterName?: string;
  /** Key of the Namespace label whose tag the runtime tests of a tenant must carry. Empty or unset: no tag is required. */
  tenantLabel?: string;
}

/** Findings of the engagements `engagementIds` that are active and not duplicates. */
export interface DefectDojoFindingsFilter {
  engagementIds: number[];
  severities?: SecuritySeverity[];
  /** Only findings of tests that carry at least one of these tags. */
  anyTestTags?: readonly string[];
  /** Only findings of tests that carry every one of these tags. */
  allTestTags?: readonly string[];
  /** Only findings of tests that carry none of these tags. */
  excludeTestTags?: readonly string[];
}

export interface DefectDojoTestsResult {
  tests: DefectDojoTest[];
  /** The engagements of `tests` with their product, by engagement id. */
  engagements: Map<number, DefectDojoPrefetchedEngagement>;
}

/** A namespace of a cluster, as named in the namespace product `<cluster>/<namespace>`. */
export interface NamespaceRef {
  cluster: string;
  namespace: string;
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
  private readonly tenantLabel: string;
  private readonly clusterName: string;

  constructor(clientConfig: DefectDojoClientConfig) {
    const {
      apiBaseURL,
      apiKey,
      webBaseURL,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      cache,
      clusterName = inClusterName,
      tenantLabel = "",
    } = clientConfig;

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
    this.clusterName = clusterName;
    this.tenantLabel = tenantLabel;
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

  async listTestsByEngagement(engagementId: number): Promise<DefectDojoTest[]> {
    const pages = await this.listPages("/tests/", { engagement: engagementId }, defectDojoTestsPageSchema);
    return pages.flatMap((page) => page.results);
  }

  /**
   * Tags the runtime tests of `tenant` must carry: the tag of the tenant label of the namespace,
   * none while no tenant label is configured.
   */
  tenantTags(tenant: string): string[] {
    return this.tenantLabel ? [namespaceLabelTag(this.tenantLabel, tenant)] : [];
  }

  /**
   * The namespace product a Stage is read from. A Stage on the portal's own cluster (no cluster name, or `in-cluster`)
   * takes the cluster name of the portal setting, any other Stage keeps its own.
   * Undefined unless cluster and namespace are DNS labels, so nothing but a plain name reaches a DefectDojo query.
   */
  namespaceRef(stageCluster: string, namespace: string): NamespaceRef | undefined {
    const cluster = stageCluster === "" || stageCluster === inClusterName ? this.clusterName : stageCluster;
    return isDnsLabel(cluster) && isDnsLabel(namespace) ? { cluster, namespace } : undefined;
  }

  /**
   * The runtime tests of the namespace product `<cluster>/<namespace>`, in one request. A test counts when it sits in
   * the `trivy-operator` engagement of that product and carries the cluster, namespace and `requiredTags` tags;
   * tests of other products are dropped even when they carry the same tags.
   */
  async listNamespaceTests(
    { cluster, namespace }: NamespaceRef,
    requiredTags: readonly string[] = []
  ): Promise<DefectDojoTestsResult> {
    if (!isDnsLabel(cluster) || !isDnsLabel(namespace)) {
      throw new Error("A namespace product needs a cluster and a namespace that are DNS labels");
    }

    const productName = `${cluster}/${namespace}`;
    const tags = [clusterTag(cluster), namespaceTag(namespace), ...requiredTags];
    const listed = await this.listTests({ tags__and: tags.join(",") });

    const tests: DefectDojoTest[] = [];
    const engagements = new Map<number, DefectDojoPrefetchedEngagement>();

    for (const test of listed.tests) {
      const engagement = listed.engagements.get(test.engagement);

      if (
        engagement?.name === TRIVY_OPERATOR_ENGAGEMENT &&
        engagement.product.name === productName &&
        tags.every((tag) => test.tags.includes(tag))
      ) {
        tests.push(test);
        engagements.set(engagement.id, engagement);
      }
    }

    return { tests, engagements };
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

  /**
   * Reads a list page by page until `count` rows are read, a page is empty or `LIST_MAX_PAGES` pages are read; warns
   * when rows remain. The next page starts after the rows a page returned, so a server that cuts a page short skips
   * nothing.
   */
  private async listPages<Page extends { count: number; results: unknown[] }>(
    path: string,
    query: Query,
    schema: ZodType<Page>
  ): Promise<Page[]> {
    const pages: Page[] = [];
    let rowsRead = 0;

    while (pages.length < LIST_MAX_PAGES) {
      const page = await this.get(path, { ...query, limit: LIST_PAGE_SIZE, offset: rowsRead }, schema);
      pages.push(page);
      rowsRead += page.results.length;

      if (page.results.length === 0 || rowsRead >= page.count) {
        break;
      }

      if (pages.length === LIST_MAX_PAGES) {
        console.warn(
          `[${DEFECTDOJO_SERVICE_NAME}] ${path} list cut at ${LIST_MAX_PAGES} pages: ${rowsRead} of ${page.count} rows read`
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

  const csv = (values?: readonly string[]) => (values?.length ? values.join(",") : undefined);

  return {
    test__engagement: filter.engagementIds.join(","),
    test__tags: csv(filter.anyTestTags),
    test__tags__and: csv(filter.allTestTags),
    not_test__tags: csv(filter.excludeTestTags),
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
