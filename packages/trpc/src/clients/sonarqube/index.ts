import { TRPCError } from "@trpc/server";
import {
  DEFAULT_TIMEOUT_MS,
  SONARQUBE_METRIC_KEYS,
  ProjectsSearchResponse,
  SonarQubeProjectsQueryParams,
  MeasuresComponentResponse,
  QualityGateStatusResponse,
  NormalizedMeasures,
  BatchMeasuresResponse,
} from "@my-project/shared";

// =============================================================================
// Configuration
// =============================================================================

interface SonarQubeConfig {
  apiBaseURL: string;
  token: string;
  timeoutMs: number;
}

/**
 * Load SonarQube configuration from environment.
 * Called once at module load time.
 */
function loadConfig(): SonarQubeConfig {
  return {
    apiBaseURL: process.env.SONAR_HOST_URL || "",
    token: process.env.SONAR_TOKEN || "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

// Load config once at module initialization
const config = loadConfig();

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a SonarQubeClient instance.
 *
 * @returns Configured SonarQubeClient instance
 * @throws TRPCError if SONAR_HOST_URL or SONAR_TOKEN is not configured
 */
export function createSonarQubeClient(): SonarQubeClient {
  if (!config.apiBaseURL) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "SONAR_HOST_URL environment variable is not configured",
    });
  }

  if (!config.token) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "SONAR_TOKEN environment variable is not configured",
    });
  }

  return new SonarQubeClient({
    apiBaseURL: config.apiBaseURL,
    token: config.token,
    timeoutMs: config.timeoutMs,
  });
}

// =============================================================================
// Client
// =============================================================================

export interface SonarQubeClientConfig {
  apiBaseURL: string;
  token: string;
  timeoutMs?: number;
}

/**
 * Client for SonarQube API.
 *
 * Features:
 * - Type-safe responses from shared types
 * - Configurable timeout with AbortController
 * - Token authentication via Authorization header
 * - Standardized error handling
 */
export class SonarQubeClient {
  private readonly apiBaseURL: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(clientConfig: SonarQubeClientConfig) {
    const { apiBaseURL, token, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("SonarQube API base URL is not configured");
    }

    if (!token) {
      throw new Error("SonarQube API token is not configured");
    }

    // Remove trailing slash if present
    this.apiBaseURL = apiBaseURL.replace(/\/$/, "");
    this.token = token;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Build query string from params object
   */
  private buildQueryString(params: Record<string, unknown>): string {
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;

      if (typeof value === "boolean") {
        queryParams.append(key, value ? "true" : "false");
      } else {
        queryParams.append(key, String(value));
      }
    }

    return queryParams.toString();
  }

  /**
   * Build endpoint URL with optional query string
   */
  private buildEndpoint(path: string, params?: Record<string, unknown>): string {
    if (!params) return path;
    const queryString = this.buildQueryString(params);
    return queryString ? `${path}?${queryString}` : path;
  }

  /**
   * Fetch JSON from SonarQube API endpoint
   * Uses Basic Authentication with token as username and empty password
   */
  private async fetchJson<T>(endpoint: string): Promise<T> {
    const url = `${this.apiBaseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          // SonarQube uses Basic Authentication: token as username, empty password
          Authorization: `Basic ${Buffer.from(`${this.token}:`).toString("base64")}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, url);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`SonarQube API request timed out after ${this.timeoutMs}ms`);
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

    const errorMessage = `SonarQube API request failed: ${response.status} ${response.statusText}`;
    const fullError = errorText ? `${errorMessage}\nResponse: ${errorText}` : errorMessage;

    console.error(`[SonarQube] Error - URL: ${url}`);
    console.error(`[SonarQube] Status: ${response.status} ${response.statusText}`);
    if (errorText) {
      console.error(`[SonarQube] Response Body: ${errorText}`);
    }

    throw new Error(fullError);
  }

  /**
   * Get projects with optional filtering and pagination
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Projects array and paging info
   *
   * @example
   * const client = createSonarQubeClient();
   * const result = await client.getProjects({
   *   page: 1,
   *   pageSize: 50,
   *   searchTerm: "my-project"
   * });
   */
  async getProjects(params: SonarQubeProjectsQueryParams): Promise<ProjectsSearchResponse> {
    const endpoint = this.buildEndpoint("/api/projects/search", {
      p: params.page,
      ps: params.pageSize,
      q: params.searchTerm,
      analyzedBefore: params.analyzedBefore,
      onProvisionedOnly: params.onProvisionedOnly,
      qualifiers: params.qualifiers,
    });

    return this.fetchJson<ProjectsSearchResponse>(endpoint);
  }

  /**
   * Get measures for a specific component
   *
   * @param componentKey - The project/component key
   * @param metricKeys - Array of metric keys to fetch
   * @returns Component with measures
   *
   * @example
   * const client = createSonarQubeClient();
   * const measures = await client.getMeasures("my-project", ["bugs", "vulnerabilities"]);
   */
  async getMeasures(
    componentKey: string,
    metricKeys: readonly string[] = SONARQUBE_METRIC_KEYS
  ): Promise<MeasuresComponentResponse> {
    const endpoint = this.buildEndpoint("/api/measures/component", {
      component: componentKey,
      metricKeys: metricKeys.join(","),
    });

    return this.fetchJson<MeasuresComponentResponse>(endpoint);
  }

  /**
   * Get measures for multiple components in a single batch request
   *
   * @param componentKeys - Array of project/component keys
   * @param metricKeys - Array of metric keys to fetch
   * @returns Batch measures response with all metrics for all components
   *
   * @example
   * const client = createSonarQubeClient();
   * const measures = await client.getBatchMeasures(
   *   ["project1", "project2", "project3"],
   *   ["bugs", "vulnerabilities", "coverage", "alert_status"]
   * );
   */
  async getBatchMeasures(
    componentKeys: string[],
    metricKeys: readonly string[] = SONARQUBE_METRIC_KEYS
  ): Promise<BatchMeasuresResponse> {
    const endpoint = this.buildEndpoint("/api/measures/search", {
      projectKeys: componentKeys.join(","),
      metricKeys: metricKeys.join(","),
    });

    return this.fetchJson<BatchMeasuresResponse>(endpoint);
  }

  /**
   * Get quality gate status for a project
   *
   * @param projectKey - The project key
   * @returns Quality gate status
   *
   * @example
   * const client = createSonarQubeClient();
   * const status = await client.getQualityGateStatus("my-project");
   */
  async getQualityGateStatus(projectKey: string): Promise<QualityGateStatusResponse> {
    const endpoint = this.buildEndpoint("/api/qualitygates/project_status", {
      projectKey,
    });

    return this.fetchJson<QualityGateStatusResponse>(endpoint);
  }

  /**
   * Parse measures array into a normalized key-value object
   *
   * @param response - The measures component response
   * @returns Normalized measures object
   */
  parseMeasures(response: MeasuresComponentResponse): NormalizedMeasures {
    const normalized: NormalizedMeasures = {};

    for (const measure of response.component.measures) {
      if (measure.value !== undefined) {
        normalized[measure.metric] = measure.value;
      }
    }

    return normalized;
  }

  /**
   * Transform batch measures response into a map grouped by component
   *
   * @param response - The batch measures response
   * @returns Map of component key to normalized measures
   *
   * @example
   * const batchResponse = await client.getBatchMeasures(["proj1", "proj2"], ["bugs", "coverage"]);
   * const byComponent = client.parseBatchMeasures(batchResponse);
   * // Result: { "proj1": { bugs: "5", coverage: "80.0" }, "proj2": { bugs: "0", coverage: "95.5" } }
   */
  parseBatchMeasures(response: BatchMeasuresResponse): Record<string, NormalizedMeasures> {
    const byComponent: Record<string, NormalizedMeasures> = {};

    for (const measure of response.measures) {
      // Initialize component entry if it doesn't exist
      if (!byComponent[measure.component]) {
        byComponent[measure.component] = {};
      }

      // Add measure value if it exists
      if (measure.value !== undefined) {
        byComponent[measure.component][measure.metric] = measure.value;
      }
    }

    return byComponent;
  }
}
