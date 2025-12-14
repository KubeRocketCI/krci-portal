import { TRPCError } from "@trpc/server";
import {
  TektonResultsListResponse,
  TektonRecordsListResponse,
  TektonResultsQueryParams,
  TektonResultRecord,
} from "@my-project/shared";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds
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
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "TEKTON_RESULTS_URL environment variable is not configured",
    });
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

/**
 * Client for Tekton Results API.
 *
 * Features:
 * - Type-safe responses from shared types
 * - Configurable timeout with AbortController
 * - Standardized error handling
 */
export class TektonResultsClient {
  private readonly apiBaseURL: string;
  private readonly parent: string;
  private readonly timeoutMs: number;

  constructor(clientConfig: TektonResultsClientConfig) {
    const { apiBaseURL, parent, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("Tekton Results API base URL is not configured");
    }

    if (!parent) {
      throw new Error("Tekton Results parent (namespace) is required");
    }

    this.apiBaseURL = apiBaseURL;
    this.parent = parent;
    this.timeoutMs = timeoutMs;
  }

  private get apiBase(): string {
    return `${this.apiBaseURL}/apis/results.tekton.dev/${TEKTON_RESULTS_API_VERSION}`;
  }

  private async fetchJson<T>(
    endpoint: string,
    queryParams?: Record<string, string | undefined>
  ): Promise<T> {
    const url = new URL(`${this.apiBase}${endpoint}`);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, value);
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, url.toString());
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Tekton Results API request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleErrorResponse(response: Response, url: string): Promise<never> {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch {
      errorText = "Unable to read error response";
    }

    const errorMessage = `Tekton Results API request failed: ${response.status} ${response.statusText}`;
    const fullError = errorText ? `${errorMessage}\nResponse: ${errorText}` : errorMessage;

    console.error(`[TektonResults] Error - URL: ${url}`);
    console.error(`[TektonResults] Status: ${response.status} ${response.statusText}`);
    if (errorText) {
      console.error(`[TektonResults] Response Body: ${errorText}`);
    }

    throw new Error(fullError);
  }

  async listResults(params: TektonResultsQueryParams = {}): Promise<TektonResultsListResponse> {
    const { filter, pageSize, pageToken, orderBy } = params;

    return this.fetchJson<TektonResultsListResponse>(`/parents/${this.parent}/results`, {
      filter,
      page_size: pageSize?.toString(),
      page_token: pageToken,
      order_by: orderBy,
    });
  }

  async listRecords(
    resultUid: string = "-",
    params: TektonResultsQueryParams = {}
  ): Promise<TektonRecordsListResponse> {
    const { filter, pageSize, pageToken, orderBy } = params;

    return this.fetchJson<TektonRecordsListResponse>(
      `/parents/${this.parent}/results/${resultUid}/records`,
      {
        filter,
        page_size: pageSize?.toString(),
        page_token: pageToken,
        order_by: orderBy,
      }
    );
  }

  async getRecord(resultUid: string, recordUid: string): Promise<TektonResultRecord> {
    return this.fetchJson<TektonResultRecord>(
      `/parents/${this.parent}/results/${resultUid}/records/${recordUid}`
    );
  }

  async getLogContent(resultUid: string, logUid: string): Promise<string> {
    const url = `${this.apiBase}/parents/${this.parent}/results/${resultUid}/logs/${logUid}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "text/plain" },
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, url);
      }

      return response.text();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Tekton Results log request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
