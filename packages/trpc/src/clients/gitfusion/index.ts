import { TRPCError } from "@trpc/server";
import {
  GitFusionRepositoryListResponse,
  GitFusionOrganizationListResponse,
  GitFusionBranchListResponse,
  GitFusionPullRequestListResponse,
  GitLabPipelineResponse,
  GitLabPipelineVariable,
} from "@my-project/shared";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

// =============================================================================
// Configuration
// =============================================================================

interface GitFusionConfig {
  apiBaseURL: string;
  timeoutMs: number;
}

/**
 * Load GitFusion configuration from environment.
 * Called once at module load time.
 */
function loadConfig(): GitFusionConfig {
  return {
    apiBaseURL: process.env.GITFUSION_URL || "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

// Load config once at module initialization
const config = loadConfig();

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a GitFusionClient instance.
 *
 * @returns Configured GitFusionClient instance
 * @throws TRPCError if GITFUSION_URL is not configured
 */
export function createGitFusionClient(): GitFusionClient {
  if (!config.apiBaseURL) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "GITFUSION_URL environment variable is not configured",
    });
  }

  return new GitFusionClient({
    apiBaseURL: config.apiBaseURL,
    timeoutMs: config.timeoutMs,
  });
}

// =============================================================================
// Client
// =============================================================================

export interface GitFusionClientConfig {
  apiBaseURL: string;
  timeoutMs?: number;
}

/**
 * Client for GitFusion API.
 *
 * Features:
 * - Type-safe responses from shared types
 * - Configurable timeout with AbortController
 * - No authentication (protected by network policies)
 * - Standardized error handling
 *
 * Security Model:
 * - GitFusion runs in trusted cluster environment
 * - Network policies restrict access to portal pods only
 * - GitFusion uses K8s-stored tokens to authenticate with git providers
 */
export class GitFusionClient {
  private readonly apiBaseURL: string;
  private readonly timeoutMs: number;

  constructor(clientConfig: GitFusionClientConfig) {
    const { apiBaseURL, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("GitFusion API base URL is not configured");
    }

    // Remove trailing slash if present
    this.apiBaseURL = apiBaseURL.replace(/\/$/, "");
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
   * Fetch JSON from GitFusion API endpoint
   * No authentication headers - GitFusion is protected by network policies
   */
  private async fetchJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = `${this.apiBaseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: init?.method ?? "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: init?.body,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, url);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`GitFusion API request timed out after ${this.timeoutMs}ms`);
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

    const errorMessage = `GitFusion API request failed: ${response.status} ${response.statusText}`;
    const fullError = errorText ? `${errorMessage}\nResponse: ${errorText}` : errorMessage;

    console.error(`[GitFusion] Error - URL: ${url}`);
    console.error(`[GitFusion] Status: ${response.status} ${response.statusText}`);
    if (errorText) {
      console.error(`[GitFusion] Response Body: ${errorText}`);
    }

    throw new Error(fullError);
  }

  /**
   * Get repositories for a given git server and owner
   *
   * @param gitServer - Git server name (GitServer CRD name in K8s)
   * @param owner - Repository owner/organization
   * @returns List of repositories
   *
   * @example
   * const client = createGitFusionClient();
   * const repos = await client.getRepositories("github-main", "my-org");
   */
  async getRepositories(gitServer: string, owner: string): Promise<GitFusionRepositoryListResponse> {
    const endpoint = this.buildEndpoint("/api/v1/repositories", {
      gitServer,
      owner,
    });

    return this.fetchJson<GitFusionRepositoryListResponse>(endpoint);
  }

  /**
   * Get organizations for the authenticated user
   *
   * @param gitServer - Git server name (GitServer CRD name in K8s)
   * @returns List of organizations
   *
   * @example
   * const client = createGitFusionClient();
   * const orgs = await client.getOrganizations("github-main");
   */
  async getOrganizations(gitServer: string): Promise<GitFusionOrganizationListResponse> {
    const endpoint = this.buildEndpoint("/api/v1/user/organizations", {
      gitServer,
    });

    return this.fetchJson<GitFusionOrganizationListResponse>(endpoint);
  }

  /**
   * Get branches for a repository
   *
   * @param gitServer - Git server name (GitServer CRD name in K8s)
   * @param owner - Repository owner/organization
   * @param repoName - Repository name
   * @returns List of branches
   *
   * @example
   * const client = createGitFusionClient();
   * const branches = await client.getBranches("github-main", "my-org", "my-repo");
   */
  async getBranches(gitServer: string, owner: string, repoName: string): Promise<GitFusionBranchListResponse> {
    const endpoint = this.buildEndpoint("/api/v1/branches", {
      gitServer,
      owner,
      repoName,
    });

    return this.fetchJson<GitFusionBranchListResponse>(endpoint);
  }

  /**
   * Get pull/merge requests for a repository
   *
   * @param gitServer - Git server name (GitServer CRD name in K8s)
   * @param owner - Repository owner/organization
   * @param repoName - Repository name
   * @param state - Filter by state (open, closed, merged, all)
   * @param page - Page number
   * @param perPage - Items per page
   * @returns List of pull requests with pagination
   */
  async getPullRequests(
    gitServer: string,
    owner: string,
    repoName: string,
    state?: string,
    page?: number,
    perPage?: number
  ): Promise<GitFusionPullRequestListResponse> {
    const endpoint = this.buildEndpoint("/api/v1/pull-requests", {
      gitServer,
      owner,
      repoName,
      state,
      page,
      perPage,
    });

    return this.fetchJson<GitFusionPullRequestListResponse>(endpoint);
  }

  /**
   * Invalidate cache for a specific endpoint
   *
   * @param endpoint - Cache endpoint to invalidate (e.g., "branches", "repositories", "organizations")
   * @returns Invalidation response
   *
   * @example
   * const client = createGitFusionClient();
   * await client.invalidateCache("branches");
   */
  async invalidateCache(endpoint: string): Promise<void> {
    const url = this.buildEndpoint("/api/v1/cache/invalidate", {
      endpoint,
    });

    await this.fetchJson<void>(url, {
      method: "DELETE",
    });
  }

  /**
   * Trigger a GitLab CI/CD pipeline
   *
   * @param gitServer - Git server name (GitServer CRD name in K8s)
   * @param project - Project path (e.g., "my-org/my-repo")
   * @param ref - Git reference (branch, tag, or commit SHA)
   * @param variables - Optional pipeline variables
   * @returns Pipeline response with ID, status, and web URL
   *
   * @example
   * const client = createGitFusionClient();
   * const pipeline = await client.triggerPipeline(
   *   "gitlab-main",
   *   "my-org/my-repo",
   *   "main",
   *   [{ key: "DEPLOY_ENV", value: "staging" }]
   * );
   */
  async triggerPipeline(
    gitServer: string,
    project: string,
    ref: string,
    variables?: GitLabPipelineVariable[]
  ): Promise<GitLabPipelineResponse> {
    const params: Record<string, unknown> = {
      gitServer,
      project,
      ref,
    };

    // GitFusion expects variables as a JSON string
    if (variables && variables.length > 0) {
      params.variables = JSON.stringify(variables);
    }

    const endpoint = this.buildEndpoint("/api/v1/trigger-pipeline", params);

    return this.fetchJson<GitLabPipelineResponse>(endpoint, {
      method: "POST",
    });
  }
}
