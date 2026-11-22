// PROTOTYPE (EPMDEDP-16072): throwaway DefectDojo read client. Not for main.
import http from "node:http";
import https from "node:https";
import { stripTrailingSlash } from "@my-project/shared";

const TIMEOUT_MS = 15_000;
const DEFAULT_PRODUCT_TYPE = "KubeRocketCI";

export interface PrototypeDefectDojoConfig {
  apiBaseURL: string;
  token: string;
  /** Browser-facing base URL for deep links. Default: `apiBaseURL`. */
  webURL: string;
  /** Default: `KubeRocketCI`. */
  productType: string;
  /** Prototype only: `Host` header for a port-forwarded DefectDojo. */
  hostHeader: string;
}

/** `null`: `DEFECTDOJO_URL` or `DEFECTDOJO_TOKEN` is not set. */
export function loadPrototypeDefectDojoConfig(): PrototypeDefectDojoConfig | null {
  const apiBaseURL = stripTrailingSlash(process.env.DEFECTDOJO_URL || "");
  const token = process.env.DEFECTDOJO_TOKEN || "";

  if (!apiBaseURL || !token) {
    return null;
  }

  return {
    apiBaseURL,
    token,
    webURL: stripTrailingSlash(process.env.DEFECTDOJO_WEB_URL || "") || apiBaseURL,
    productType: process.env.DEFECTDOJO_PRODUCT_TYPE || DEFAULT_PRODUCT_TYPE,
    hostHeader: process.env.DEFECTDOJO_HOST_HEADER || "",
  };
}

/** DefectDojo is down, timed out, rejected the token or answered with a non-2xx status. */
export class PrototypeDefectDojoUnreachableError extends Error {
  constructor(reason: string, options?: ErrorOptions) {
    super(`DefectDojo is unreachable: ${reason}`, options);
    this.name = "PrototypeDefectDojoUnreachableError";
  }
}

export type PrototypeDefectDojoQuery = Record<string, string | number | boolean | undefined>;

export interface DefectDojoPage<T, P = undefined> {
  count: number;
  next: string | null;
  results: T[];
  prefetch?: P;
}

export interface DefectDojoRawProduct {
  id: number;
  name: string;
  tags: string[];
  prod_type: number;
}

export interface DefectDojoRawEngagement {
  id: number;
  name: string;
  product: { id: number; name: string; prod_type: { id: number; name: string } };
}

export interface DefectDojoRawTest {
  id: number;
  title: string | null;
  scan_type: string;
  branch_tag: string | null;
  version: string | null;
  build_id: string | null;
  engagement: number;
  tags: string[];
  created: string;
  updated: string;
}

/** `related_fields` of a v2 finding read with `related_fields=true`. */
export interface DefectDojoRawRelatedFields {
  test?: { engagement?: DefectDojoRawEngagement };
}

/** Allow-listed subset of a v2 finding. Other fields of the response are not read. */
export interface DefectDojoRawFinding {
  id: number;
  test: number;
  title: string;
  severity: string;
  active: boolean;
  verified: boolean;
  false_p: boolean;
  out_of_scope: boolean;
  risk_accepted: boolean;
  duplicate: boolean;
  is_mitigated: boolean;
  under_review: boolean;
  date: string | null;
  created: string | null;
  updated: string | null;
  mitigated: string | null;
  component_name: string | null;
  component_version: string | null;
  vulnerability_ids: { vulnerability_id: string }[] | null;
  cwe: number | null;
  cvssv3_score: number | null;
  epss_score: number | null;
  known_exploited: boolean | null;
  file_path: string | null;
  line: number | null;
  service: string | null;
  fix_available: boolean | null;
  fix_version: string | null;
  sla_days_remaining: number | null;
  tags: string[] | null;
  related_fields?: DefectDojoRawRelatedFields | null;
}

export interface DefectDojoRawCounts {
  total: number;
  active: number;
  severity: { Critical: number; High: number; Medium: number; Low: number; Info: number };
}

interface DefectDojoV3CountsPage {
  meta: { counts: DefectDojoRawCounts };
}

/** Upper bound of products and tests read in one request; no paging beyond it. */
const LIST_LIMIT = 500;

/**
 * GET-only client. Authenticates with `Authorization: Token <token>`.
 * `requests` collects the path and query of every request made through the instance.
 */
export class PrototypeDefectDojoClient {
  readonly requests: string[] = [];

  constructor(readonly config: PrototypeDefectDojoConfig) {}

  /** Products that carry every tag of `tags`, with their Product Type in `prefetch.prod_type`. */
  listProducts(tags: string[]) {
    return this.get<DefectDojoPage<DefectDojoRawProduct, { prod_type?: Record<string, { id: number; name: string }> }>>(
      "/api/v2/products/",
      { tags__and: joinTags(tags), prefetch: "prod_type", limit: LIST_LIMIT }
    );
  }

  /** Tests that carry every tag of `tags`, with engagement and product in `prefetch.engagement`. */
  listTests(tags: string[]) {
    return this.get<DefectDojoPage<DefectDojoRawTest, { engagement?: Record<string, DefectDojoRawEngagement> }>>(
      "/api/v2/tests/",
      { tags__and: joinTags(tags), prefetch: "engagement", limit: LIST_LIMIT }
    );
  }

  /**
   * API v3 counts of a test, a product or a set of products (`asset__in`, one request for the set).
   * `activeOnly: false` counts findings of every state.
   */
  async countFindings(
    scope: "test" | "product" | "productSet",
    ids: number[],
    activeOnly: boolean
  ): Promise<DefectDojoRawCounts> {
    const filterKey = { test: "test", product: "asset", productSet: "asset__in" }[scope];
    const page = await this.get<DefectDojoV3CountsPage>("/api/v3/findings", {
      limit: 1,
      include: "counts",
      active: activeOnly ? true : undefined,
      [filterKey]: ids.join(","),
    });
    return page.meta.counts;
  }

  /** Id of the test type with the exact name, or `null`. */
  async findTestTypeId(name: string): Promise<number | null> {
    const page = await this.get<DefectDojoPage<{ id: number; name: string }>>("/api/v2/test_types/", { name });
    return page.results.find((testType) => testType.name === name)?.id ?? null;
  }

  /** Findings, most severe first. `withTest` adds the test of every row to `prefetch.test` and its engagement to `related_fields`. */
  listFindings(query: PrototypeDefectDojoQuery, withTest: boolean) {
    return this.get<DefectDojoPage<DefectDojoRawFinding, { test?: Record<string, DefectDojoRawTest> }>>(
      "/api/v2/findings/",
      {
        ...query,
        related_fields: withTest ? true : undefined,
        prefetch: withTest ? "test" : undefined,
        o: "numerical_severity",
      }
    );
  }

  private get<T>(path: string, query: PrototypeDefectDojoQuery): Promise<T> {
    const url = new URL(`${this.config.apiBaseURL}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.append(key, String(value));
      }
    }
    this.requests.push(`${url.pathname}${url.search}`);

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Token ${this.config.token}`,
    };
    // `fetch` drops a caller-set Host header; node:http sends it.
    if (this.config.hostHeader) {
      headers.Host = this.config.hostHeader;
    }

    const transport = url.protocol === "https:" ? https : http;

    return new Promise<T>((resolve, reject) => {
      const request = transport.request(url, { method: "GET", headers, timeout: TIMEOUT_MS }, (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("error", (error) => reject(new PrototypeDefectDojoUnreachableError("response", { cause: error })));
        response.on("end", () => {
          const status = response.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new PrototypeDefectDojoUnreachableError(`status ${status}`));
            return;
          }
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as T);
          } catch (error) {
            reject(new PrototypeDefectDojoUnreachableError("invalid JSON", { cause: error }));
          }
        });
      });

      request.on("timeout", () => request.destroy(new Error(`timeout after ${TIMEOUT_MS}ms`)));
      request.on("error", (error) => reject(new PrototypeDefectDojoUnreachableError("request", { cause: error })));
      request.end();
    });
  }
}

/** Tag filters split on commas; a tag never holds one (the producers replace it with `-`). Tags are stored lower-case. */
export function joinTags(tags: string[] | undefined): string | undefined {
  if (!tags) {
    return undefined;
  }
  return tags.length > 0 ? tags.map((tag) => tag.toLowerCase()).join(",") : undefined;
}
