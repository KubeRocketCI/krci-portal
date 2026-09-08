import { TRPCError } from "@trpc/server";
import {
  DEFAULT_TIMEOUT_MS,
  SONARQUBE_METRIC_KEYS,
  ProjectsSearchResponse,
  SonarQubeProjectsQueryParams,
  ComponentShowResponse,
  MeasuresComponentResponse,
  QualityGateStatusResponse,
  NormalizedMeasures,
  BatchMeasuresResponse,
  IssuesQueryParams,
  IssuesSearchResponse,
} from "@my-project/shared";
import { createHttpService, HttpStatusError, type HttpService } from "../http/index.js";

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
 * SonarQube scope selector. SonarQube treats pullRequest and branch as
 * mutually exclusive at the API level; callers enforce that invariant.
 * Passing neither targets the default branch of the project.
 */
export interface SonarScope {
  pullRequest?: string;
  branch?: string;
}

/** Client for the SonarQube API. Authenticates with a token in the `Authorization` header. */
export class SonarQubeClient {
  private readonly http: HttpService;

  constructor(clientConfig: SonarQubeClientConfig) {
    const { apiBaseURL, token, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("SonarQube API base URL is not configured");
    }

    if (!token) {
      throw new Error("SonarQube API token is not configured");
    }

    this.http = createHttpService({
      name: "SonarQube",
      baseURL: apiBaseURL,
      timeoutMs,
      // SonarQube uses Basic Authentication: token as username, empty password
      headers: { Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}` },
    });
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
    return this.http.json<ProjectsSearchResponse>("/api/components/search", {
      query: { qualifiers: "TRK", p: params.page, ps: params.pageSize, q: params.searchTerm },
    });
  }

  /**
   * Get a single component/project by exact key
   *
   * @param componentKey - The project/component key
   * @param scope - Optional SonarQube scope. Pass `pullRequest` or `branch`
   *   (mutually exclusive at the SonarQube API level). Forwarded as
   *   `pullRequest=<id>` / `branch=<name>` respectively.
   * @returns Component data, or null if not found
   */
  async getComponent(componentKey: string, scope?: SonarScope): Promise<ComponentShowResponse | null> {
    try {
      return await this.http.json<ComponentShowResponse>("/api/components/show", {
        query: { component: componentKey, pullRequest: scope?.pullRequest, branch: scope?.branch },
      });
    } catch (error) {
      if (error instanceof HttpStatusError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get measures for a specific component
   *
   * @param componentKey - The project/component key
   * @param metricKeys - Array of metric keys to fetch
   * @param scope - Optional SonarQube scope (pullRequest xor branch).
   * @returns Component with measures
   *
   * @example
   * const client = createSonarQubeClient();
   * const measures = await client.getMeasures("my-project", ["bugs", "vulnerabilities"]);
   */
  async getMeasures(
    componentKey: string,
    metricKeys: readonly string[] = SONARQUBE_METRIC_KEYS,
    scope?: SonarScope
  ): Promise<MeasuresComponentResponse> {
    return this.http.json<MeasuresComponentResponse>("/api/measures/component", {
      query: {
        component: componentKey,
        metricKeys: metricKeys.join(","),
        pullRequest: scope?.pullRequest,
        branch: scope?.branch,
      },
    });
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
    return this.http.json<BatchMeasuresResponse>("/api/measures/search", {
      query: { projectKeys: componentKeys.join(","), metricKeys: metricKeys.join(",") },
    });
  }

  /**
   * Get quality gate status for a project
   *
   * @param projectKey - The project key
   * @param scope - Optional SonarQube scope (pullRequest xor branch).
   * @returns Quality gate status
   *
   * @example
   * const client = createSonarQubeClient();
   * const status = await client.getQualityGateStatus("my-project");
   */
  async getQualityGateStatus(projectKey: string, scope?: SonarScope): Promise<QualityGateStatusResponse> {
    return this.http.json<QualityGateStatusResponse>("/api/qualitygates/project_status", {
      query: { projectKey, pullRequest: scope?.pullRequest, branch: scope?.branch },
    });
  }

  /**
   * Search issues for a project
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Issues search response with pagination
   *
   * @example
   * const client = createSonarQubeClient();
   * const issues = await client.getIssues({
   *   componentKeys: "my-project",
   *   types: "BUG,VULNERABILITY",
   *   severities: "BLOCKER,CRITICAL",
   *   p: 1,
   *   ps: 25
   * });
   */
  async getIssues(params: IssuesQueryParams): Promise<IssuesSearchResponse> {
    return this.http.json<IssuesSearchResponse>("/api/issues/search", {
      query: {
        componentKeys: params.componentKeys,
        resolved: params.resolved,
        types: params.types,
        severities: params.severities,
        statuses: params.statuses,
        p: params.p,
        ps: params.ps,
        s: params.s,
        asc: params.asc,
        pullRequest: params.pullRequest,
        branch: params.branch,
      },
    });
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
