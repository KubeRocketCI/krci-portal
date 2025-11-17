import {
  DepTrackProjectData,
  DepTrackProjectMetrics,
  SonarQubeMetrics,
  NormalizedSonarQubeMetrics,
  GitFusionRepositoryListResponse,
  GitFusionOrganizationListResponse,
  GitFusionBranchListResponse,
  GitLabPipelineResponse,
  GitLabPipelineVariable,
} from "@my-project/shared";

export class KrakendClient {
  private apiBaseURL: string;
  private headers: Headers;

  constructor(params: { apiBaseURL: string; idToken: string }) {
    const { apiBaseURL, idToken } = params;
    if (!apiBaseURL) {
      throw new Error("Krakend API base URL is not configured");
    }

    this.apiBaseURL = apiBaseURL;
    this.headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    });

    if (idToken) {
      this.headers.set("Authorization", `Bearer ${idToken}`);
    }
  }

  private async fetchJson<DataType>(path: string, init?: RequestInit): Promise<DataType> {
    const url = new URL(path, this.apiBaseURL).toString();
    const response = await fetch(url, {
      method: init?.method ?? "GET",
      headers: this.headers,
      body: init?.body,
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        errorText = "Unable to read error response";
      }

      const errorMessage = `Krakend request failed: ${response.status} ${response.statusText}`;
      const fullError = errorText ? `${errorMessage}\nResponse: ${errorText}` : errorMessage;

      console.error(`Krakend Error - URL: ${url}`);
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Response Body: ${errorText}`);

      throw new Error(fullError);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text() as unknown as DataType;
  }

  async getDepTrackProjectData(name: string): Promise<DepTrackProjectData> {
    const params = new URLSearchParams({ name });
    return this.fetchJson(`/widgets/deptrack/project?${params.toString()}`);
  }

  getDepTrackProjectID(projectData: DepTrackProjectData): string {
    const main = projectData.collection.find((item) => item.version === "main");

    const project = main || projectData.collection[0];

    return project?.uuid;
  }

  async getDepTrackProjectMetrics(projectID: string): Promise<DepTrackProjectMetrics> {
    const params = new URLSearchParams({
      projectID: projectID,
    });

    return this.fetchJson<DepTrackProjectMetrics>(
      `/widgets/deptrack/metrics/project/${projectID}/current?${params.toString()}`
    );
  }

  async getSonarQubeMetrics(componentName: string): Promise<SonarQubeMetrics> {
    const metricKeys = [
      "bugs",
      "code_smells",
      "coverage",
      "duplicated_lines_density",
      "ncloc",
      "sqale_rating",
      "alert_status",
      "reliability_rating",
      "security_hotspots",
      "security_rating",
      "sqale_index",
      "vulnerabilities",
    ];
    const params = new URLSearchParams({
      component: componentName,
      metricKeys: metricKeys.join(","),
    });

    return this.fetchJson<SonarQubeMetrics>(`/widgets/sonarqube/measures/component?${params.toString()}`);
  }

  parseSonarQubeMetrics(metrics: SonarQubeMetrics): NormalizedSonarQubeMetrics {
    const values: NormalizedSonarQubeMetrics = {
      alert_status: "",
      bugs: "",
      reliability_rating: "",
      vulnerabilities: "",
      security_rating: "",
      code_smells: "",
      sqale_index: "",
      sqale_rating: "",
      security_hotspots_reviewed: "",
      security_hotspots: "",
      security_review_rating: "",
      coverage: "",
      ncloc: "",
      duplicated_lines_density: "",
    };

    for (const metric of metrics.component.measures) {
      values[metric.metric] = metric.value;
    }

    return values;
  }

  async getPipelineRunLogs(namespace: string, name: string): Promise<unknown> {
    const logsQuery = {
      _source: ["log", "kubernetes.labels.tekton_dev/pipelineTask"],
      query: {
        bool: {
          must: [
            { match_phrase: { "kubernetes.namespace_name": namespace } },
            {
              match_phrase: {
                "kubernetes.labels.tekton_dev/pipelineRun": name,
              },
            },
            { range: { "@timestamp": { gte: "now-10d", lte: "now" } } },
          ],
        },
      },
      sort: [{ "@timestamp": { order: "asc" } }],
      size: 5000,
    };

    return this.fetchJson(`/search/logs`, {
      method: "POST",
      body: JSON.stringify(logsQuery),
    });
  }

  async getAllPipelineRunsLogs(namespace: string): Promise<unknown> {
    const logsQuery = {
      size: 0,
      query: {
        bool: {
          filter: [
            {
              range: {
                "@timestamp": {
                  gte: "now-10d",
                  lte: "now",
                },
              },
            },
            {
              term: {
                "kubernetes.namespace_name.keyword": namespace,
              },
            },
          ],
        },
      },
      aggs: {
        unique_pipelineRuns: {
          terms: {
            field: "kubernetes.labels.tekton_dev/pipelineRun.keyword",
            size: 100,
          },
        },
      },
    };
    return this.fetchJson(`/search/logs`, {
      method: "POST",
      body: JSON.stringify(logsQuery),
    });
  }

  async getGitFusionRepositories(gitServer: string, owner: string): Promise<GitFusionRepositoryListResponse> {
    const params = new URLSearchParams({
      gitServer,
      owner,
    });
    return this.fetchJson(`/gitfusion/repositories?${params.toString()}`);
  }

  async getGitFusionOrganizations(gitServer: string): Promise<GitFusionOrganizationListResponse> {
    const params = new URLSearchParams({
      gitServer,
    });
    return this.fetchJson(`/gitfusion/organizations?${params.toString()}`);
  }

  async getGitFusionBranches(gitServer: string, owner: string, repoName: string): Promise<GitFusionBranchListResponse> {
    const params = new URLSearchParams({
      gitServer,
      owner,
      repoName,
    });
    return this.fetchJson(`/gitfusion/branches?${params.toString()}`);
  }

  async invalidateGitFusionBranchListCache(): Promise<unknown> {
    const params = new URLSearchParams({
      endpoint: "branches",
    });
    return this.fetchJson(`/gitfusion/invalidate?${params.toString()}`, {
      method: "POST",
    });
  }

  async triggerGitLabPipeline(
    gitServer: string,
    project: string,
    ref: string,
    variables?: GitLabPipelineVariable[]
  ): Promise<GitLabPipelineResponse> {
    const params = new URLSearchParams({
      gitServer,
      project,
      ref,
    });

    if (variables && variables.length > 0) {
      params.append("variables", JSON.stringify(variables));
    }

    const endpoint = `/gitfusion/trigger-pipeline?${params.toString()}`;

    return this.fetchJson<GitLabPipelineResponse>(endpoint, {
      method: "POST",
    });
  }
}
