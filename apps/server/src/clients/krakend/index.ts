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

  private async fetchJson(path: string, init?: RequestInit): Promise<unknown> {
    const url = new URL(path, this.apiBaseURL).toString();
    const response = await fetch(url, {
      method: init?.method ?? "GET",
      headers: this.headers,
      body: init?.body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Krakend request failed: ${response.status} ${response.statusText} ${text}`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  async getDepTrackProject(name: string): Promise<unknown> {
    const params = new URLSearchParams({ name });
    return this.fetchJson(`/widgets/deptrack/project?${params.toString()}`);
  }

  async getDepTrackProjectMetrics(projectID: string): Promise<unknown> {
    return this.fetchJson(
      `/widgets/deptrack/metrics/project/${encodeURIComponent(projectID)}/current`
    );
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
}
