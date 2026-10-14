import {
  TektonResultsListResponse,
  TektonRecordsListResponse,
  TektonResultsQueryParams,
  TektonResultRecord,
  TektonSummaryQueryParams,
  TektonSummaryResponse,
  stripTrailingSlash,
  validateCELFilter,
} from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { createHttpService, notConfiguredError, type HttpService } from "../http/index.js";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds
const SERVICE_NAME = "Tekton Results";
const TEKTON_RESULTS_API_VERSION = "v1alpha2";

// =============================================================================
// Configuration
// =============================================================================

interface TektonResultsConfig {
  apiBaseURL: string;
  timeoutMs: number;
}

/**
 * Load Tekton Results configuration from environment.
 * Called once at module load time.
 */
function loadConfig(): TektonResultsConfig {
  return {
    apiBaseURL: process.env.TEKTON_RESULTS_URL || "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

// Load config once at module initialization
const config = loadConfig();

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a TektonResultsClient for the specified namespace.
 *
 * @param namespace - Kubernetes namespace (required for Tekton Results API path)
 * @returns Configured TektonResultsClient instance
 * @throws TRPCError if TEKTON_RESULTS_URL is not configured
 */
export function createTektonResultsClient(namespace: string): TektonResultsClient {
  if (!config.apiBaseURL) {
    throw notConfiguredError(SERVICE_NAME, "TEKTON_RESULTS_URL");
  }

  return new TektonResultsClient({
    apiBaseURL: config.apiBaseURL,
    parent: namespace,
    timeoutMs: config.timeoutMs,
  });
}

// =============================================================================
// Client
// =============================================================================

export interface TektonResultsClientConfig {
  apiBaseURL: string;
  parent: string;
  timeoutMs?: number;
}

/** Client for the Tekton Results API. Every path is scoped to `parent` (the namespace). */
export class TektonResultsClient {
  private readonly parent: string;
  private readonly http: HttpService;

  constructor(clientConfig: TektonResultsClientConfig) {
    const { apiBaseURL, parent, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("Tekton Results API base URL is not configured");
    }

    if (!parent) {
      throw new Error("Tekton Results parent (namespace) is required");
    }

    this.parent = parent;
    this.http = createHttpService({
      name: SERVICE_NAME,
      baseURL: `${stripTrailingSlash(apiBaseURL)}/apis/results.tekton.dev/${TEKTON_RESULTS_API_VERSION}`,
      timeoutMs,
    });
  }

  /**
   * Last gate before a filter leaves for Tekton Results. Validates the final,
   * server-composed string, so a filter assembled from non-schema input (record
   * names, scope-guard combines) still cannot carry a delimiter into cel2sql.
   */
  private assertFilterSafe(filter: string | undefined): void {
    if (filter === undefined) return;
    const result = validateCELFilter(filter);
    if (!result.valid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid Tekton Results filter: ${result.message} (position ${result.position})`,
      });
    }
  }

  async listResults(params: TektonResultsQueryParams = {}): Promise<TektonResultsListResponse> {
    const { filter, pageSize, pageToken, orderBy } = params;
    this.assertFilterSafe(filter);

    return this.http.json<TektonResultsListResponse>(`/parents/${this.parent}/results`, {
      query: { filter, page_size: pageSize, page_token: pageToken, order_by: orderBy },
    });
  }

  async listRecords(
    resultUid: string = "-",
    params: TektonResultsQueryParams = {}
  ): Promise<TektonRecordsListResponse> {
    const { filter, pageSize, pageToken, orderBy } = params;
    this.assertFilterSafe(filter);

    return this.http.json<TektonRecordsListResponse>(`/parents/${this.parent}/results/${resultUid}/records`, {
      query: { filter, page_size: pageSize, page_token: pageToken, order_by: orderBy },
    });
  }

  async getRecord(resultUid: string, recordUid: string): Promise<TektonResultRecord> {
    return this.http.json<TektonResultRecord>(`/parents/${this.parent}/results/${resultUid}/records/${recordUid}`);
  }

  async getLogContent(resultUid: string, logUid: string): Promise<string> {
    return this.http.text(`/parents/${this.parent}/results/${resultUid}/logs/${logUid}`);
  }

  /**
   * Get aggregated summary statistics for records.
   *
   * @param params - Query parameters for summary aggregation
   * @returns Aggregated summary data
   *
   * @example
   * // Get overall stats for PipelineRuns
   * const summary = await client.getSummary({
   *   summary: "total,succeeded,failed,avg_duration",
   *   filter: "data_type == 'PIPELINE_RUN'",
   * });
   *
   * @example
   * // Get daily breakdown
   * const dailyStats = await client.getSummary({
   *   summary: "total,succeeded,failed",
   *   groupBy: "day",
   *   filter: "data_type == 'PIPELINE_RUN'",
   * });
   */
  async getSummary(params: TektonSummaryQueryParams = {}): Promise<TektonSummaryResponse> {
    const { summary, groupBy, filter, orderBy } = params;
    this.assertFilterSafe(filter);

    return this.http.json<TektonSummaryResponse>(`/parents/${this.parent}/results/-/records/summary`, {
      query: { summary, group_by: groupBy, filter, order_by: orderBy },
    });
  }
}
