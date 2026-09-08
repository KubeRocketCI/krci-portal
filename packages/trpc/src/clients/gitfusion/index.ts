import { TRPCError } from "@trpc/server";
import {
  GitFusionRepositoryListResponse,
  GitFusionOrganizationListResponse,
  GitFusionBranchListResponse,
  GitFusionPullRequestListResponse,
  GitFusionPipelineListResponse,
  GitFusionPipelineJobListResponse,
  GitFusionPipelineJobTrace,
  GitLabPipelineResponse,
  GitLabPipelineVariable,
} from "@my-project/shared";
import { createHttpService, withTRPCErrors, type HttpService } from "../http/index.js";

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
      code: "PRECONDITION_FAILED",
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
 * Client for the GitFusion API.
 *
 * Security model:
 * - GitFusion runs in the trusted cluster; network policies restrict access to portal pods only
 * - The portal sends no auth headers; GitFusion authenticates to git providers with K8s-stored tokens
 * - A 401 here is relayed from the git provider (the stored token is invalid), not a GitFusion auth failure
 */
export class GitFusionClient {
  private readonly http: HttpService;

  constructor(clientConfig: GitFusionClientConfig) {
    const { apiBaseURL, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("GitFusion API base URL is not configured");
    }

    // Wrapped: the GitFusion procedures do not catch, so the upstream status must reach the
    // browser as a tRPC code.
    this.http = withTRPCErrors(
      createHttpService({
        name: "GitFusion",
        baseURL: apiBaseURL,
        timeoutMs,
        headers: { "Content-Type": "application/json" },
      })
    );
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
    return this.http.json<GitFusionRepositoryListResponse>("/api/v1/repositories", {
      query: { gitServer, owner },
    });
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
    return this.http.json<GitFusionOrganizationListResponse>("/api/v1/user/organizations", {
      query: { gitServer },
    });
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
    return this.http.json<GitFusionBranchListResponse>("/api/v1/branches", {
      query: { gitServer, owner, repoName },
    });
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
    return this.http.json<GitFusionPullRequestListResponse>("/api/v1/pull-requests", {
      query: { gitServer, owner, repoName, state, page, perPage },
    });
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
    await this.http.json<void>("/api/v1/cache/invalidate", {
      query: { endpoint },
      method: "DELETE",
    });
  }

  /** List CI/CD pipelines for a project (provider-agnostic; GitLab today). */
  async getPipelines(
    gitServer: string,
    project: string,
    opts?: { ref?: string; status?: string; page?: number; perPage?: number }
  ): Promise<GitFusionPipelineListResponse> {
    return this.http.json<GitFusionPipelineListResponse>("/api/v1/pipelines", {
      query: {
        gitServer,
        project,
        ref: opts?.ref,
        status: opts?.status,
        page: opts?.page,
        perPage: opts?.perPage,
      },
    });
  }

  /** List the jobs of a CI/CD pipeline (provider-agnostic; GitLab today). */
  async getPipelineJobs(
    gitServer: string,
    project: string,
    pipelineId: string
  ): Promise<GitFusionPipelineJobListResponse> {
    return this.http.json<GitFusionPipelineJobListResponse>("/api/v1/pipeline-jobs", {
      query: { gitServer, project, pipelineId },
    });
  }

  /** Get the trace (log) of a CI/CD pipeline job. */
  async getJobTrace(gitServer: string, project: string, jobId: string): Promise<GitFusionPipelineJobTrace> {
    return this.http.json<GitFusionPipelineJobTrace>("/api/v1/pipeline-job-trace", {
      query: { gitServer, project, jobId },
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
    const query: Record<string, unknown> = { gitServer, project, ref };

    // GitFusion expects variables as a JSON string
    if (variables && variables.length > 0) {
      query.variables = JSON.stringify(variables);
    }

    return this.http.json<GitLabPipelineResponse>("/api/v1/trigger-pipeline", { query, method: "POST" });
  }
}
