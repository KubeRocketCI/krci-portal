import { TRPCError } from "@trpc/server";
import {
  PortfolioMetricsResponse,
  DEPENDENCY_TRACK_API_VERSION,
  DEFAULT_PORTFOLIO_METRICS_DAYS,
  ProjectsQueryParams,
  ProjectsResponse,
  DependencyTrackProject,
  ComponentsQueryParams,
  ComponentsResponse,
  DependencyTrackComponent,
  ServicesQueryParams,
  ServicesResponse,
  DependencyTrackService,
  DependencyGraphResponse,
  FindingsQueryParams,
  FindingsResponse,
  ViolationsQueryParams,
  ViolationsResponse,
} from "@my-project/shared";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

// =============================================================================
// Configuration
// =============================================================================

interface DependencyTrackConfig {
  apiBaseURL: string;
  apiKey: string;
  timeoutMs: number;
}

/**
 * Load Dependency Track configuration from environment.
 * Called once at module load time.
 */
function loadConfig(): DependencyTrackConfig {
  return {
    apiBaseURL: process.env.DEPENDENCY_TRACK_URL || "",
    apiKey: process.env.DEPENDENCY_TRACK_API_KEY || "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

// Load config once at module initialization
const config = loadConfig();

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a DependencyTrackClient instance.
 * Unlike Tekton Results, this is not namespace-scoped.
 *
 * @returns Configured DependencyTrackClient instance
 * @throws TRPCError if DEPENDENCY_TRACK_URL or DEPENDENCY_TRACK_API_KEY is not configured
 */
export function createDependencyTrackClient(): DependencyTrackClient {
  if (!config.apiBaseURL) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "DEPENDENCY_TRACK_URL environment variable is not configured",
    });
  }

  if (!config.apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "DEPENDENCY_TRACK_API_KEY environment variable is not configured",
    });
  }

  return new DependencyTrackClient({
    apiBaseURL: config.apiBaseURL,
    apiKey: config.apiKey,
    timeoutMs: config.timeoutMs,
  });
}

// =============================================================================
// Client
// =============================================================================

export interface DependencyTrackClientConfig {
  apiBaseURL: string;
  apiKey: string;
  timeoutMs?: number;
}

/**
 * Client for Dependency Track API.
 *
 * Features:
 * - Type-safe responses from shared types
 * - Configurable timeout with AbortController
 * - API key authentication via X-Api-Key header
 * - Standardized error handling
 */
export class DependencyTrackClient {
  private readonly apiBaseURL: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(clientConfig: DependencyTrackClientConfig) {
    const { apiBaseURL, apiKey, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("Dependency Track API base URL is not configured");
    }

    if (!apiKey) {
      throw new Error("Dependency Track API key is not configured");
    }

    this.apiBaseURL = apiBaseURL;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  private get apiBase(): string {
    return `${this.apiBaseURL}/api/${DEPENDENCY_TRACK_API_VERSION}`;
  }

  /**
   * Build query string from params object, handling DT API's 1-indexed pagination
   */
  private buildQueryString(params: Record<string, unknown>): string {
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;

      // DT API uses 1-indexed page numbers, so add 1 to our 0-indexed page
      if (key === "pageNumber") {
        queryParams.append(key, String((value as number) + 1));
      } else if (typeof value === "boolean") {
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

  private async fetchJson<T>(endpoint: string): Promise<T>;
  private async fetchJson<T>(endpoint: string, includeHeaders: true): Promise<{ data: T; headers: Headers }>;
  private async fetchJson<T>(endpoint: string, includeHeaders?: boolean): Promise<T | { data: T; headers: Headers }> {
    const url = `${this.apiBase}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Api-Key": this.apiKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, url);
      }

      const data = (await response.json()) as T;
      return includeHeaders ? { data, headers: response.headers } : data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Dependency Track API request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Extract total count from response headers
   */
  private getTotalCount(headers: Headers): number {
    return parseInt(headers.get("x-total-count") || "0", 10);
  }

  private async handleErrorResponse(response: Response, url: string): Promise<never> {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch {
      errorText = "Unable to read error response";
    }

    const errorMessage = `Dependency Track API request failed: ${response.status} ${response.statusText}`;
    const fullError = errorText ? `${errorMessage}\nResponse: ${errorText}` : errorMessage;

    console.error(`[DependencyTrack] Error - URL: ${url}`);
    console.error(`[DependencyTrack] Status: ${response.status} ${response.statusText}`);
    if (errorText) {
      console.error(`[DependencyTrack] Response Body: ${errorText}`);
    }

    throw new Error(fullError);
  }

  /**
   * Get portfolio metrics for the specified number of days
   *
   * @param days - Number of days of historical data to retrieve
   * @returns Array of portfolio metrics over time
   *
   * @example
   * const client = createDependencyTrackClient();
   * const metrics = await client.getPortfolioMetrics(90);
   */
  async getPortfolioMetrics(days: number): Promise<PortfolioMetricsResponse> {
    return this.fetchJson<PortfolioMetricsResponse>(`/metrics/portfolio/${days}/days`);
  }

  /**
   * Get projects with optional filtering, sorting, and pagination
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Projects array and total count
   *
   * @example
   * const client = createDependencyTrackClient();
   * const result = await client.getProjects({
   *   pageNumber: 1,
   *   pageSize: 25,
   *   excludeInactive: false,
   *   onlyRoot: true
   * });
   */
  async getProjects(params: ProjectsQueryParams): Promise<ProjectsResponse> {
    const endpoint = this.buildEndpoint("/project", {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      sortName: params.sortName,
      sortOrder: params.sortOrder,
      excludeInactive: params.excludeInactive || undefined,
      onlyRoot: params.onlyRoot || undefined,
      tag: params.tag,
      classifier: params.classifier,
      searchText: params.searchTerm, // API expects 'searchText'
    });

    const { data, headers } = await this.fetchJson<DependencyTrackProject[]>(endpoint, true);

    return {
      projects: data,
      totalCount: this.getTotalCount(headers),
    };
  }

  /**
   * Get a single project by UUID
   *
   * @param uuid - Project UUID
   * @returns Project details
   *
   * @example
   * const client = createDependencyTrackClient();
   * const project = await client.getProject("550e8400-e29b-41d4-a716-446655440000");
   */
  async getProject(uuid: string): Promise<DependencyTrackProject> {
    return this.fetchJson<DependencyTrackProject>(`/project/${uuid}`);
  }

  /**
   * Get project metrics time series for the specified number of days
   *
   * @param uuid - Project UUID
   * @param days - Number of days of historical data to retrieve (default: 90)
   * @returns Array of project metrics over time
   *
   * @example
   * const client = createDependencyTrackClient();
   * const metrics = await client.getProjectMetrics("550e8400-e29b-41d4-a716-446655440000", 90);
   */
  async getProjectMetrics(
    uuid: string,
    days: number = DEFAULT_PORTFOLIO_METRICS_DAYS
  ): Promise<PortfolioMetricsResponse> {
    return this.fetchJson<PortfolioMetricsResponse>(`/metrics/project/${uuid}/days/${days}`);
  }

  /**
   * Get components for a project with optional filtering, sorting, and pagination
   *
   * @param uuid - Project UUID
   * @param params - Query parameters for filtering and pagination
   * @returns Components array and total count
   *
   * @example
   * const client = createDependencyTrackClient();
   * const result = await client.getComponents("550e8400-e29b-41d4-a716-446655440000", {
   *   pageNumber: 0,
   *   pageSize: 25,
   *   sortName: "name",
   *   sortOrder: "asc"
   * });
   */
  async getComponents(uuid: string, params: ComponentsQueryParams): Promise<ComponentsResponse> {
    const endpoint = this.buildEndpoint(`/component/project/${uuid}`, {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      sortName: params.sortName,
      sortOrder: params.sortOrder,
      onlyOutdated: params.onlyOutdated,
      onlyDirect: params.onlyDirect,
    });

    const { data, headers } = await this.fetchJson<DependencyTrackComponent[]>(endpoint, true);

    return {
      components: data,
      totalCount: this.getTotalCount(headers),
    };
  }

  /**
   * Get services for a project with optional filtering, sorting, and pagination
   *
   * @param uuid - Project UUID
   * @param params - Query parameters for pagination and sorting
   * @returns Services array and total count
   *
   * @example
   * const client = createDependencyTrackClient();
   * const result = await client.getServices("550e8400-e29b-41d4-a716-446655440000", {
   *   pageNumber: 0,
   *   pageSize: 25,
   *   sortName: "name",
   *   sortOrder: "asc"
   * });
   */
  async getServices(uuid: string, params: ServicesQueryParams): Promise<ServicesResponse> {
    const endpoint = this.buildEndpoint(`/service/project/${uuid}`, {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      sortName: params.sortName,
      sortOrder: params.sortOrder,
    });

    const { data, headers } = await this.fetchJson<DependencyTrackService[]>(endpoint, true);

    return {
      services: data,
      totalCount: this.getTotalCount(headers),
    };
  }

  /**
   * Get dependency graph for a project
   *
   * @param uuid - Project UUID
   * @returns Dependency graph data with direct dependencies
   *
   * @example
   * const client = createDependencyTrackClient();
   * const graph = await client.getDependencyGraph("550e8400-e29b-41d4-a716-446655440000");
   */
  async getDependencyGraph(uuid: string): Promise<DependencyGraphResponse> {
    return this.fetchJson<DependencyGraphResponse>(`/dependencyGraph/project/${uuid}/directDependencies`);
  }

  /**
   * Get findings (vulnerabilities) for a project
   *
   * @param uuid - Project UUID
   * @param params - Query parameters for filtering findings
   * @returns List of findings
   *
   * @example
   * const client = createDependencyTrackClient();
   * const findings = await client.getFindingsByProject("550e8400-e29b-41d4-a716-446655440000", {
   *   suppressed: false
   * });
   */
  async getFindingsByProject(uuid: string, params: FindingsQueryParams): Promise<FindingsResponse> {
    const endpoint = this.buildEndpoint(`/finding/project/${uuid}`, {
      suppressed: params.suppressed,
      source: params.source,
    });

    return this.fetchJson<FindingsResponse>(endpoint);
  }

  /**
   * Get policy violations for a specific project
   * @param uuid Project UUID
   * @param params Query parameters
   * @returns List of policy violations
   *
   * @example
   * const client = createDependencyTrackClient();
   * const violations = await client.getViolationsByProject("550e8400-e29b-41d4-a716-446655440000", {
   *   suppressed: false
   * });
   */
  async getViolationsByProject(uuid: string, params: ViolationsQueryParams): Promise<ViolationsResponse> {
    const endpoint = this.buildEndpoint(`/violation/project/${uuid}`, {
      suppressed: params.suppressed,
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
    });

    return this.fetchJson<ViolationsResponse>(endpoint);
  }
}
