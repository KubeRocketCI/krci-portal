import { CustomSession } from "@/trpc/context";
import { KubeConfig } from "@kubernetes/client-node";

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
}
