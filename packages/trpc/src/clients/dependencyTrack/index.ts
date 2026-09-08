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
  stripTrailingSlash,
} from "@my-project/shared";
import { createHttpService, HttpStatusError, type HttpService } from "../http/index.js";

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
      cause: { kind: "sca_not_configured", missing: "DEPENDENCY_TRACK_URL" },
    });
  }

  if (!config.apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "DEPENDENCY_TRACK_API_KEY environment variable is not configured",
      cause: { kind: "sca_not_configured", missing: "DEPENDENCY_TRACK_API_KEY" },
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

/** Client for the Dependency Track API. Authenticates with an API key in the `X-Api-Key` header. */
export class DependencyTrackClient {
  private readonly http: HttpService;

  constructor(clientConfig: DependencyTrackClientConfig) {
    const { apiBaseURL, apiKey, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("Dependency Track API base URL is not configured");
    }

    if (!apiKey) {
      throw new Error("Dependency Track API key is not configured");
    }

    this.http = createHttpService({
      name: "Dependency Track",
      baseURL: `${stripTrailingSlash(apiBaseURL)}/api/${DEPENDENCY_TRACK_API_VERSION}`,
      timeoutMs,
      headers: { "X-Api-Key": apiKey },
    });
  }

  /** `X-Total-Count` of a paginated list response. Throws unless it is a non-negative safe integer. */
  private getTotalCount(headers: Headers): number {
    const raw = headers.get("x-total-count");
    const parsed = raw !== null && /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
    if (!Number.isSafeInteger(parsed)) {
      throw new Error(`Dependency Track response has no valid X-Total-Count header (got ${JSON.stringify(raw)})`);
    }
    return parsed;
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
    return this.http.json<PortfolioMetricsResponse>(`/metrics/portfolio/${days}/days`);
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
    const { data, headers } = await this.http.jsonWithHeaders<DependencyTrackProject[]>("/project", {
      query: {
        pageNumber: toApiPageNumber(params.pageNumber),
        pageSize: params.pageSize,
        sortName: params.sortName,
        sortOrder: params.sortOrder,
        excludeInactive: params.excludeInactive || undefined,
        onlyRoot: params.onlyRoot || undefined,
        tag: params.tag,
        classifier: params.classifier,
        searchText: params.searchTerm, // API expects 'searchText'
      },
    });

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
    return this.http.json<DependencyTrackProject>(`/project/${uuid}`);
  }

  /**
   * Get a specific project by its exact name and version (direct lookup)
   *
   * Uses the /v1/project/lookup endpoint for efficient exact-match queries.
   * This is much more efficient than searching and filtering, and avoids
   * pagination issues when a project has many versions.
   *
   * @param name - Exact project name
   * @param version - Exact version/branch (e.g., "main", "develop")
   * @returns Project with metrics, or null if not found (404 response)
   *
   * @example
   * const client = createDependencyTrackClient();
   * const project = await client.getProjectByNameAndVersion("my-service", "main");
   * if (project) {
   *   console.log(`Found project: ${project.name} v${project.version}`);
   * } else {
   *   console.log("Project not found");
   * }
   */
  async getProjectByNameAndVersion(name: string, version: string): Promise<DependencyTrackProject | null> {
    try {
      return await this.http.json<DependencyTrackProject>("/project/lookup", { query: { name, version } });
    } catch (error) {
      // DependencyTrack returns 404 if project with exact name+version not found
      // We handle this gracefully by returning null instead of throwing
      if (error instanceof HttpStatusError && error.status === 404) {
        return null;
      }
      // Re-throw other errors (network issues, 500s, etc.)
      throw error;
    }
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
    return this.http.json<PortfolioMetricsResponse>(`/metrics/project/${uuid}/days/${days}`);
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
  async getComponents(uuid: string, params: ComponentsQueryParams, signal?: AbortSignal): Promise<ComponentsResponse> {
    const { data, headers } = await this.http.jsonWithHeaders<DependencyTrackComponent[]>(
      `/component/project/${uuid}`,
      {
        query: {
          pageNumber: toApiPageNumber(params.pageNumber),
          pageSize: params.pageSize,
          sortName: params.sortName,
          sortOrder: params.sortOrder,
          onlyOutdated: params.onlyOutdated,
          onlyDirect: params.onlyDirect,
        },
        signal,
      }
    );

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
    const { data, headers } = await this.http.jsonWithHeaders<DependencyTrackService[]>(`/service/project/${uuid}`, {
      query: {
        pageNumber: toApiPageNumber(params.pageNumber),
        pageSize: params.pageSize,
        sortName: params.sortName,
        sortOrder: params.sortOrder,
      },
    });

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
    return this.http.json<DependencyGraphResponse>(`/dependencyGraph/project/${uuid}/directDependencies`);
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
    return this.http.json<FindingsResponse>(`/finding/project/${uuid}`, {
      query: { suppressed: params.suppressed, source: params.source },
    });
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
    return this.http.json<ViolationsResponse>(`/violation/project/${uuid}`, {
      query: {
        suppressed: params.suppressed,
        pageNumber: toApiPageNumber(params.pageNumber),
        pageSize: params.pageSize,
      },
    });
  }
}

/** Dependency Track pages are 1-indexed; the portal counts from 0. */
function toApiPageNumber(pageNumber: number | undefined): number | undefined {
  return pageNumber === undefined ? undefined : pageNumber + 1;
}
