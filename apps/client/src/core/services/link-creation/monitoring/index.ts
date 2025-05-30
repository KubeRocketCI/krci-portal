import { monitoringProvider } from "@my-project/shared";

export const MonitoringURLService = {
  createDashboardLink: ({
    provider,
    baseURL,
    namespace,
    clusterName,
  }: {
    provider: string | undefined;
    baseURL: string | undefined;
    namespace: string;
    clusterName?: string;
  }) => {
    if (!baseURL) {
      return undefined;
    }

    switch (provider) {
      case monitoringProvider.grafana: {
        const theme =
          (globalThis?.localStorage && globalThis?.localStorage.getItem("headlampThemePreference")) || "light";

        return `${baseURL}/d/85a562078cdf77779eaa1add43ccec1e/kubernetes-compute-resources-namespace-pods?orgId=1&refresh=10s&var-datasource=default&var-cluster=&var-namespace=${namespace}&theme=${theme}`;
      }
      case monitoringProvider.datadog: {
        return `${baseURL}/dash/integration/Kubernetes%20-%20Pods?tpl_var_cluster=${clusterName}&tpl_var_namespace=${namespace}`;
      }
      default: {
        return baseURL;
      }
    }
  },
};
