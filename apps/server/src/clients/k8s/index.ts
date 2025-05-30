import { CustomSession } from "@/trpc/context";
import { CoreV1Api } from "@kubernetes/client-node";
import { KubeConfig } from "@kubernetes/client-node";
import { K8sResourceConfig } from "@my-project/shared";

// List of used Core resources
type SupportedCoreKind =
  | "ConfigMap"
  | "Secret"
  | "ServiceAccount"
  | "ResourceQuota"
  | "Pod"
  | "Service"
  | "Node";

type OperationParams =
  | {
      operation: "list";
      namespace: string;
    }
  | {
      operation: "read" | "delete" | "connect";
      name: string;
      namespace: string;
    }
  | { operation: "create"; namespace: string; body: object }
  | {
      operation: "patch" | "replace";
      name: string;
      namespace: string;
      body: object;
    };

export const isCoreKubernetesResource = (resourceConfig: K8sResourceConfig) => {
  return resourceConfig.group === "";
};

export class K8sClient {
  KubeConfig: KubeConfig | null;

  constructor(session: CustomSession | undefined) {
    if (!session || !session.user) {
      this.KubeConfig = null;
      return;
    }

    this.KubeConfig = new KubeConfig();

    // Load base configuration
    if (process.env.NODE_ENV === "production") {
      this.KubeConfig.loadFromCluster();
    } else {
      this.KubeConfig.loadFromDefault();
    }

    const userName = session.user?.data?.email || "oidc-user";
    const userToken = session.user?.secret.idToken;

    // Validate token presence
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

  async callCoreResourceOperation(
    kind: string,
    params: OperationParams
  ): Promise<unknown> {
    if (!this.KubeConfig) {
      throw new Error("KubeConfig is not initialized");
    }

    const coreV1Api = this.KubeConfig.makeApiClient(CoreV1Api);

    switch (kind) {
      case "ConfigMap":
      case "Secret":
      case "ServiceAccount":
      case "Pod":
      case "ResourceQuota":
        return this.dispatchOperation(coreV1Api, kind, params);
      default:
        throw new Error(`Unsupported core kind: ${kind}`);
    }
  }

  private async dispatchOperation(
    api: CoreV1Api,
    kind: SupportedCoreKind,
    params: OperationParams
  ): Promise<unknown> {
    const { operation } = params;

    switch (kind) {
      case "ConfigMap":
        switch (operation) {
          case "list":
            return api.listNamespacedConfigMap({ namespace: params.namespace });
          case "read":
            return api.readNamespacedConfigMap({
              name: params.name,
              namespace: params.namespace,
            });
          case "delete":
            return api.deleteNamespacedConfigMap({
              name: params.name,
              namespace: params.namespace,
            });
          case "create":
            return api.createNamespacedConfigMap({
              namespace: params.namespace,
              body: params.body,
            });
          case "patch":
            return api.patchNamespacedConfigMap({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
          case "replace":
            return api.replaceNamespacedConfigMap({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
        }
        break;

      case "Secret":
        switch (operation) {
          case "list":
            return api.listNamespacedSecret({ namespace: params.namespace });
          case "read":
            return api.readNamespacedSecret({
              name: params.name,
              namespace: params.namespace,
            });
          case "delete":
            return api.deleteNamespacedSecret({
              name: params.name,
              namespace: params.namespace,
            });
          case "create":
            return api.createNamespacedSecret({
              namespace: params.namespace,
              body: params.body,
            });
          case "patch":
            return api.patchNamespacedSecret({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
          case "replace":
            return api.replaceNamespacedSecret({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
        }
        break;

      case "ServiceAccount":
        switch (operation) {
          case "list":
            return api.listNamespacedServiceAccount({
              namespace: params.namespace,
            });
          case "read":
            return api.readNamespacedServiceAccount({
              name: params.name,
              namespace: params.namespace,
            });
          case "delete":
            return api.deleteNamespacedServiceAccount({
              name: params.name,
              namespace: params.namespace,
            });
          case "create":
            return api.createNamespacedServiceAccount({
              namespace: params.namespace,
              body: params.body,
            });
          case "patch":
            return api.patchNamespacedServiceAccount({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
          case "replace":
            return api.replaceNamespacedServiceAccount({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
        }
        break;

      case "ResourceQuota":
        switch (operation) {
          case "list":
            return api.listNamespacedResourceQuota({
              namespace: params.namespace,
            });
          case "read":
            return api.readNamespacedResourceQuota({
              name: params.name,
              namespace: params.namespace,
            });
          case "delete":
            return api.deleteNamespacedResourceQuota({
              name: params.name,
              namespace: params.namespace,
            });
          case "create":
            return api.createNamespacedResourceQuota({
              namespace: params.namespace,
              body: params.body,
            });
          case "patch":
            return api.patchNamespacedResourceQuota({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
          case "replace":
            return api.replaceNamespacedResourceQuota({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
        }
        break;

      case "Pod":
        if (operation === "connect") {
          return api.connectGetNamespacedPodProxy({
            name: params.name,
            namespace: params.namespace,
          });
        }

        switch (operation) {
          case "list":
            return api.listNamespacedPod({ namespace: params.namespace });
          case "read":
            return api.readNamespacedPod({
              name: params.name,
              namespace: params.namespace,
            });
          case "delete":
            return api.deleteNamespacedPod({
              name: params.name,
              namespace: params.namespace,
            });
          case "create":
            return api.createNamespacedPod({
              namespace: params.namespace,
              body: params.body,
            });
          case "patch":
            return api.patchNamespacedPod({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
          case "replace":
            return api.replaceNamespacedPod({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
        }
        break;

      case "Service":
        if (operation === "connect") {
          return api.connectGetNamespacedServiceProxy({
            name: params.name,
            namespace: params.namespace,
          });
        }

        switch (operation) {
          case "list":
            return api.listNamespacedService({ namespace: params.namespace });
          case "read":
            return api.readNamespacedService({
              name: params.name,
              namespace: params.namespace,
            });
          case "delete":
            return api.deleteNamespacedService({
              name: params.name,
              namespace: params.namespace,
            });
          case "create":
            return api.createNamespacedService({
              namespace: params.namespace,
              body: params.body,
            });
          case "patch":
            return api.patchNamespacedService({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
          case "replace":
            return api.replaceNamespacedService({
              name: params.name,
              namespace: params.namespace,
              body: params.body,
            });
        }
        break;

      case "Node":
        if (operation === "connect") {
          return api.connectGetNodeProxy({ name: params.name });
        }

        switch (operation) {
          case "list":
            return api.listNode();
          case "read":
            return api.readNode({ name: params.name });
          case "delete":
            return api.deleteNode({ name: params.name });
          case "patch":
            return api.patchNode({ name: params.name, body: params.body });
          case "replace":
            return api.replaceNode({ name: params.name, body: params.body });
          // No `create` for Node
        }
        break;
    }

    throw new Error(`Unsupported operation ${operation} for kind ${kind}`);
  }
}
