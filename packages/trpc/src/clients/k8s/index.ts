import { CustomSession } from "../../context/types";
import { KubeConfig } from "@kubernetes/client-node";
import { K8sResourceConfig, KubeObjectBase, KubeObjectListBase } from "@my-project/shared";
import fetch from "node-fetch";
import https from "https";
import fs from "fs";
import { K8sApiError } from "./K8sApiError";

export const isCoreKubernetesResource = (resourceConfig: K8sResourceConfig) => resourceConfig.group === "";

// Cluster-scoped core resources (no namespace in URL)
const CLUSTER_SCOPED_CORE_RESOURCES = new Set([
  "Node",
  "PersistentVolume",
  "ClusterRole",
  "ClusterRoleBinding",
  "Namespace",
]);

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class K8sClient {
  KubeConfig: KubeConfig | null;

  constructor(session: CustomSession | undefined) {
    if (!session || !session.user) {
      this.KubeConfig = null;
      return;
    }

    const idTokenExpiresAt = session.user.secret.idTokenExpiresAt;
    if (idTokenExpiresAt && Date.now() >= idTokenExpiresAt) {
      throw new Error("Token has expired. Please log in again.");
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
      throw new Error("No access token provided in session");
    }

    this.KubeConfig.users = [
      {
        name: userName,
        token: userToken,
      },
    ];

    const cluster = this.KubeConfig.getCurrentCluster();
    if (!cluster) {
      throw new Error("No cluster configuration found");
    }

    const currentContext = this.KubeConfig.getCurrentContext();
    if (!currentContext) {
      throw new Error("No current context found in kubeConfig");
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
   * Unified method to list any Kubernetes resource (core or custom)
   */
  async listResource(
    resourceConfig: K8sResourceConfig,
    namespace: string,
    labelSelector?: string
  ): Promise<KubeObjectListBase<KubeObjectBase>> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace });
    const queryParams = new URLSearchParams();

    if (labelSelector) {
      queryParams.append("labelSelector", labelSelector);
    }

    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

    return this.makeRequest("GET", fullUrl) as unknown as KubeObjectListBase<KubeObjectBase>;
  }

  /**
   * Get a specific resource by name
   */
  async getResource(resourceConfig: K8sResourceConfig, name: string, namespace: string): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace, name });
    return this.makeRequest("GET", url);
  }

  /**
   * Delete a specific resource by name
   */
  async deleteResource(resourceConfig: K8sResourceConfig, name: string, namespace: string): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace, name });
    return this.makeRequest("DELETE", url);
  }

  /**
   * Create a new resource
   */
  async createResource(resourceConfig: K8sResourceConfig, namespace: string, body: object): Promise<KubeObjectBase> {
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
    namespace: string,
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
    namespace: string,
    body: object
  ): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace, name });
    return this.makeRequest("PATCH", url, body);
  }

  /**
   * Build the appropriate Kubernetes API URL for any resource
   */
  private buildResourceUrl(resourceConfig: K8sResourceConfig, options: { namespace?: string; name?: string }): string {
    const cluster = this.KubeConfig!.getCurrentCluster();
    if (!cluster) {
      throw new Error("No current cluster found");
    }

    const { server } = cluster;
    const { namespace, name } = options;

    const isNamespaced = !CLUSTER_SCOPED_CORE_RESOURCES.has(resourceConfig.kind) && resourceConfig.kind !== "Namespace";

    let basePath: string;
    let resourcePath: string;

    // Extract version from either version field or apiVersion field
    const version = resourceConfig.version || resourceConfig.apiVersion?.split("/").pop() || "v1";

    if (isCoreKubernetesResource(resourceConfig)) {
      basePath = `/api/${version}`;

      if (isNamespaced && namespace) {
        resourcePath = `namespaces/${namespace}/${resourceConfig.pluralName}`;
      } else {
        resourcePath = resourceConfig.pluralName;
      }
    } else {
      // Handle empty group case to avoid double slashes
      if (resourceConfig.group) {
        basePath = `/apis/${resourceConfig.group}/${version}`;
      } else {
        basePath = `/apis/${version}`;
      }

      if (isNamespaced && namespace) {
        resourcePath = `namespaces/${namespace}/${resourceConfig.pluralName}`;
      } else {
        resourcePath = resourceConfig.pluralName;
      }
    }

    // Ensure no double slashes by cleaning up the path construction
    let url = `${server}${basePath}/${resourcePath}`.replace(/\/+/g, "/").replace(":/", "://");

    if (name) {
      url += `/${name}`;
    }

    return url;
  }

  /**
   * Make authenticated HTTP request to Kubernetes API
   */
  private async makeRequest(
    method: HttpMethod,
    url: string,
    body?: object
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

    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      requestHeaders["Content-Type"] = "application/json";
    }

    const opts = {
      method,
      headers: requestHeaders,
      agent,
      body: undefined as string | undefined,
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
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
