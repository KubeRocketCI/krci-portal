import fs from "fs";
import https from "https";

import { KubeConfig } from "@kubernetes/client-node";
import { K8sApiError, K8sResourceConfig, KubeObjectBase, KubeObjectListBase } from "@my-project/shared";
import fetch from "node-fetch";

import { CLUSTER_SCOPED_CORE_RESOURCES, isCoreKubernetesResource } from "../../routers/k8s/constants/index.js";
import { CustomSession } from "../../context/types.js";

export { isCoreKubernetesResource };

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type PatchType = "strategic" | "merge" | "json";
export type PatchSubresource = "scale" | "status";

export class K8sClient {
  KubeConfig: KubeConfig | null;
  // Captures the specific reason the KubeConfig could not be initialized so
  // `getInitializedK8sClient` can surface it in the TRPCError message instead
  // of a generic "client could not be initialized" string. Operators rely on
  // this to distinguish "no session" from "missing cluster config" from
  // "missing current context" when triaging KRCI integration-view failures.
  kubeConfigInitError: string | null = null;

  constructor(session: CustomSession | undefined) {
    if (!session || !session.user) {
      this.KubeConfig = null;
      this.kubeConfigInitError = "No active session for this request.";
      return;
    }

    this.KubeConfig = new KubeConfig();

    if (process.env.NODE_ENV === "production") {
      this.KubeConfig.loadFromCluster();
    } else {
      this.KubeConfig.loadFromDefault();
    }

    const userName = session.user?.data?.email || "oidc-user";
    const userToken = session.user?.secret.idToken;

    if (!userToken) {
      this.KubeConfig = null;
      this.kubeConfigInitError = "No access token provided in session.";
      return;
    }

    this.KubeConfig.users = [
      {
        name: userName,
        token: userToken,
      },
    ];

    const cluster = this.KubeConfig.getCurrentCluster();
    if (!cluster) {
      this.KubeConfig = null;
      this.kubeConfigInitError = "No cluster configuration found in kubeconfig.";
      return;
    }

    const currentContext = this.KubeConfig.getCurrentContext();
    if (!currentContext) {
      this.KubeConfig = null;
      this.kubeConfigInitError = "No current context found in kubeconfig.";
      return;
    }

    this.KubeConfig.contexts = [
      {
        name: currentContext,
        cluster: cluster.name,
        user: userName,
      },
    ];
    this.KubeConfig.setCurrentContext(currentContext);
  }

  /**
   * Helper method to load certificate data from inline base64 or file
   */
  private loadCertificate(data: string | undefined, file: string | undefined): string | undefined {
    if (data) {
      return Buffer.from(data, "base64").toString("utf8");
    }
    if (file) {
      try {
        return fs.readFileSync(file, "utf8");
      } catch (error) {
        console.error(`Failed to read certificate file ${file}:`, error);
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Unified method to list any Kubernetes resource (core or custom). Returns the
   * single page returned by the API server (subject to the API server's chunk
   * limit, typically 500 items by default). Use {@link listAllResources} when the
   * full set is required.
   */
  async listResource(
    resourceConfig: K8sResourceConfig,
    namespace?: string,
    labelSelector?: string,
    options?: { limit?: number; continueToken?: string }
  ): Promise<KubeObjectListBase<KubeObjectBase>> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace });
    const queryParams = new URLSearchParams();

    if (labelSelector) {
      queryParams.append("labelSelector", labelSelector);
    }
    if (options?.limit && options.limit > 0) {
      queryParams.append("limit", String(options.limit));
    }
    if (options?.continueToken) {
      queryParams.append("continue", options.continueToken);
    }

    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

    return this.makeRequest("GET", fullUrl) as unknown as KubeObjectListBase<KubeObjectBase>;
  }

  /**
   * List every page of a resource by following the API server's `continue` token.
   * Use when a single-page response could miss items (e.g. ReplicaSet history of a
   * long-lived Deployment exceeding the default 500-item chunk limit).
   */
  async listAllResources(
    resourceConfig: K8sResourceConfig,
    namespace?: string,
    labelSelector?: string,
    options?: { pageSize?: number; maxPages?: number }
  ): Promise<KubeObjectListBase<KubeObjectBase>> {
    const pageSize = options?.pageSize;
    const maxPages = options?.maxPages ?? 20;

    let continueToken: string | undefined;
    let pages = 0;
    const items: KubeObjectBase[] = [];
    let lastPage: KubeObjectListBase<KubeObjectBase> | undefined;

    do {
      const page = await this.listResource(resourceConfig, namespace, labelSelector, {
        limit: pageSize,
        continueToken,
      });
      items.push(...(page.items ?? []));
      lastPage = page;
      continueToken = (page.metadata as { continue?: string } | undefined)?.continue;
      pages += 1;
    } while (continueToken && pages < maxPages);

    if (continueToken) {
      // Pagination cap hit with a non-empty continue token — callers receive a
      // truncated result and have no other signal. Warn so the gap is at least
      // diagnosable in server logs (e.g. rollback failing with NOT_FOUND for a
      // valid RS that lives beyond the cap).
      console.warn(
        `listAllResources: maxPages cap of ${maxPages} reached for ${resourceConfig.kind}` +
          `${namespace ? ` in namespace ${namespace}` : ""}; results are truncated.`
      );
    }

    // Reuse the last page's envelope (kind/apiVersion/metadata.resourceVersion)
    // and replace the items array with the accumulated set.
    return { ...lastPage!, items };
  }

  /**
   * Fetch an arbitrary Kubernetes API path (e.g. Metrics API).
   * The path is appended to the cluster server URL.
   */
  async fetchApiPath<T = unknown>(path: string): Promise<T> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const cluster = this.KubeConfig.getCurrentCluster();
    if (!cluster) {
      throw new Error("No current cluster found");
    }

    const url = `${cluster.server}${path}`;
    return this.makeRequest("GET", url) as unknown as T;
  }

  /**
   * Get a specific resource by name
   */
  async getResource(resourceConfig: K8sResourceConfig, name: string, namespace?: string): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace, name });
    return this.makeRequest("GET", url);
  }

  /**
   * Delete a specific resource by name
   */
  async deleteResource(resourceConfig: K8sResourceConfig, name: string, namespace?: string): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace, name });
    return this.makeRequest("DELETE", url);
  }

  /**
   * Create a new resource
   */
  async createResource(
    resourceConfig: K8sResourceConfig,
    namespace: string | undefined,
    body: object
  ): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace });
    return this.makeRequest("POST", url, body);
  }

  /**
   * Replace (update) an existing resource
   */
  async replaceResource(
    resourceConfig: K8sResourceConfig,
    name: string,
    namespace: string | undefined,
    body: object
  ): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace, name });
    return this.makeRequest("PUT", url, body);
  }

  /**
   * Patch an existing resource
   */
  async patchResource(
    resourceConfig: K8sResourceConfig,
    name: string,
    namespace: string | undefined,
    body: object,
    patchType: PatchType = "strategic",
    subresource?: PatchSubresource
  ): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace, name, subresource });
    return this.makeRequest("PATCH", url, body, patchType);
  }

  /**
   * Discover pluralName and scope for a given apiVersion + kind via the K8s discovery API.
   */
  async discoverResource(apiVersion: string, kind: string): Promise<{ pluralName: string; namespaced: boolean }> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const path = apiVersion === "v1" ? `/api/v1` : `/apis/${apiVersion}`;

    const resourceList = await this.fetchApiPath<{
      resources?: Array<{ name: string; namespaced: boolean; kind: string }>;
    }>(path);

    const resource = resourceList.resources?.find((r) => r.kind === kind && !r.name.includes("/"));

    if (!resource) {
      throw new Error(`Resource kind "${kind}" not found in apiVersion "${apiVersion}"`);
    }

    return { pluralName: resource.name, namespaced: resource.namespaced };
  }

  /**
   * Build the appropriate Kubernetes API URL for any resource
   */
  private buildResourceUrl(
    resourceConfig: K8sResourceConfig,
    options: { namespace?: string; name?: string; subresource?: string }
  ): string {
    const cluster = this.KubeConfig!.getCurrentCluster();
    if (!cluster) {
      throw new Error("No current cluster found");
    }

    const { server } = cluster;
    const { namespace, name, subresource } = options;

    const isNamespaced =
      !resourceConfig.clusterScoped &&
      !CLUSTER_SCOPED_CORE_RESOURCES.has(resourceConfig.kind) &&
      resourceConfig.kind !== "Namespace";

    // Extract version from either version field or apiVersion field
    const version = resourceConfig.version || resourceConfig.apiVersion?.split("/").pop() || "v1";

    const basePath = isCoreKubernetesResource(resourceConfig)
      ? `/api/${version}`
      : resourceConfig.group
        ? `/apis/${resourceConfig.group}/${version}`
        : `/apis/${version}`;

    const resourcePath =
      isNamespaced && namespace ? `namespaces/${namespace}/${resourceConfig.pluralName}` : resourceConfig.pluralName;

    let url = `${server}${basePath}/${resourcePath}`;

    if (name) {
      url += `/${name}`;
    }

    if (subresource) {
      url += `/${subresource}`;
    }

    // Ensure no double slashes anywhere in the path (applied after all segments are appended)
    return url.replace(/([^:])\/{2,}/g, "$1/");
  }

  /**
   * Make authenticated HTTP request to Kubernetes API
   */
  private async makeRequest(
    method: HttpMethod,
    url: string,
    body?: object,
    patchType?: PatchType
  ): Promise<KubeObjectBase | KubeObjectListBase<KubeObjectBase>> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const currentUser = this.KubeConfig.getCurrentUser();
    const currentCluster = this.KubeConfig.getCurrentCluster();

    // Load certificates from inline data or files
    const ca = this.loadCertificate(currentCluster?.caData, currentCluster?.caFile);
    const cert = this.loadCertificate(currentUser?.certData, currentUser?.certFile);
    const key = this.loadCertificate(currentUser?.keyData, currentUser?.keyFile);

    const agent = new https.Agent({
      ca,
      cert,
      key,
      keepAlive: true,
      rejectUnauthorized: !currentCluster?.skipTLSVerify,
    });

    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
    };

    const opts = {
      method,
      headers: requestHeaders,
      agent,
      body: undefined as string | undefined,
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      if (method === "PATCH") {
        requestHeaders["Content-Type"] =
          patchType === "merge"
            ? "application/merge-patch+json"
            : patchType === "json"
              ? "application/json-patch+json"
              : "application/strategic-merge-patch+json";
      } else {
        requestHeaders["Content-Type"] = "application/json";
      }
      opts.body = JSON.stringify(body);
    }

    this.KubeConfig.applyToHTTPSOptions(opts);

    const response = await fetch(url, opts);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new K8sApiError(response.status, response.statusText, errorText);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json() as unknown as KubeObjectBase | KubeObjectListBase<KubeObjectBase>;
    }

    return response.text() as unknown as KubeObjectBase | KubeObjectListBase<KubeObjectBase>;
  }
}
