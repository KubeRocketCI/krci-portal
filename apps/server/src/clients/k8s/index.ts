import { CustomSession } from "@/trpc/context";
import { KubeConfig } from "@kubernetes/client-node";
import {
  K8sResourceConfig,
  KubeObjectBase,
  KubeObjectListBase,
} from "@my-project/shared";
import fetch from "node-fetch";
import https from "https";
import fs from "fs";

export const isCoreKubernetesResource = (resourceConfig: K8sResourceConfig) =>
  resourceConfig.group === "";

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

    this.KubeConfig = new KubeConfig();

    console.log(`[K8sClient] Initializing in ${process.env.NODE_ENV} mode`);

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

    // Debug logging for certificate configuration
    console.log("[K8sClient] Cluster configuration:", {
      name: cluster.name,
      server: cluster.server,
      skipTLSVerify: cluster.skipTLSVerify,
      hasCaData: !!cluster.caData,
      caDataLength: cluster.caData?.length || 0,
      hasCaFile: !!cluster.caFile,
      caFile: cluster.caFile,
    });

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

    const fullUrl = queryParams.toString()
      ? `${url}?${queryParams.toString()}`
      : url;

    return this.makeRequest(
      "GET",
      fullUrl
    ) as unknown as KubeObjectListBase<KubeObjectBase>;
  }

  /**
   * Get a specific resource by name
   */
  async getResource(
    resourceConfig: K8sResourceConfig,
    name: string,
    namespace: string
  ): Promise<KubeObjectBase> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const url = this.buildResourceUrl(resourceConfig, { namespace, name });
    return this.makeRequest("GET", url);
  }

  /**
   * Delete a specific resource by name
   */
  async deleteResource(
    resourceConfig: K8sResourceConfig,
    name: string,
    namespace: string
  ): Promise<KubeObjectBase> {
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
    namespace: string,
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
  private buildResourceUrl(
    resourceConfig: K8sResourceConfig,
    options: { namespace?: string; name?: string }
  ): string {
    const cluster = this.KubeConfig!.getCurrentCluster();
    if (!cluster) {
      throw new Error("No current cluster found");
    }

    const { server } = cluster;
    const { namespace, name } = options;

    const isNamespaced =
      !CLUSTER_SCOPED_CORE_RESOURCES.has(resourceConfig.kind) &&
      resourceConfig.kind !== "Namespace";

    let basePath: string;
    let resourcePath: string;

    // Extract version from either version field or apiVersion field
    const version =
      resourceConfig.version ||
      resourceConfig.apiVersion?.split("/").pop() ||
      "v1";

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
    let url = `${server}${basePath}/${resourcePath}`
      .replace(/\/+/g, "/")
      .replace(":/", "://");

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

    console.log(`[K8sClient] Making ${method} request to:`, url);
    console.log("[K8sClient] Certificate info before agent creation:", {
      hasCaData: !!currentCluster?.caData,
      caDataLength: currentCluster?.caData?.length || 0,
      hasCaFile: !!currentCluster?.caFile,
      caFile: currentCluster?.caFile,
      hasCertData: !!currentUser?.certData,
      hasKeyData: !!currentUser?.keyData,
      skipTLSVerify: currentCluster?.skipTLSVerify,
      rejectUnauthorized: !currentCluster?.skipTLSVerify,
    });

    // Get CA certificate: either from inline data or from file
    let ca: string | undefined = undefined;
    if (currentCluster?.caData) {
      // CA is inline as base64
      ca = Buffer.from(currentCluster.caData, "base64").toString("utf8");
      console.log("[K8sClient] Using inline CA data");
    } else if (currentCluster?.caFile) {
      // CA is in a file, read it
      try {
        ca = fs.readFileSync(currentCluster.caFile, "utf8");
        console.log(
          `[K8sClient] Read CA from file: ${currentCluster.caFile} (${ca.length} bytes)`
        );
      } catch (error) {
        console.error(
          `[K8sClient] Failed to read CA file ${currentCluster.caFile}:`,
          error
        );
      }
    }

    // Get client certificate: either from inline data or from file
    let cert: string | undefined = undefined;
    if (currentUser?.certData) {
      cert = Buffer.from(currentUser.certData, "base64").toString("utf8");
    } else if (currentUser?.certFile) {
      try {
        cert = fs.readFileSync(currentUser.certFile, "utf8");
      } catch (error) {
        console.error(
          `[K8sClient] Failed to read cert file ${currentUser.certFile}:`,
          error
        );
      }
    }

    // Get client key: either from inline data or from file
    let key: string | undefined = undefined;
    if (currentUser?.keyData) {
      key = Buffer.from(currentUser.keyData, "base64").toString("utf8");
    } else if (currentUser?.keyFile) {
      try {
        key = fs.readFileSync(currentUser.keyFile, "utf8");
      } catch (error) {
        console.error(
          `[K8sClient] Failed to read key file ${currentUser.keyFile}:`,
          error
        );
      }
    }

    const agent = new https.Agent({
      ca,
      cert,
      key,
      keepAlive: true,
      rejectUnauthorized: !currentCluster?.skipTLSVerify,
    });

    console.log("[K8sClient] Agent created with:", {
      hasCA: !!agent.options.ca,
      hasCert: !!agent.options.cert,
      hasKey: !!agent.options.key,
      keepAlive: agent.options.keepAlive,
      rejectUnauthorized: agent.options.rejectUnauthorized,
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
      agent: agent,
      body: undefined as string | undefined,
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      opts.body = JSON.stringify(body);
    }

    console.log("[K8sClient] Before applyToHTTPSOptions");

    this.KubeConfig.applyToHTTPSOptions(opts);

    console.log("[K8sClient] After applyToHTTPSOptions, agent updated:", {
      hasAgent: !!opts.agent,
      agentChanged: opts.agent !== agent,
    });

    const response = await fetch(url, opts);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Kubernetes API request failed: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json() as unknown as
        | KubeObjectBase
        | KubeObjectListBase<KubeObjectBase>;
    }

    return response.text() as unknown as
      | KubeObjectBase
      | KubeObjectListBase<KubeObjectBase>;
  }
}
