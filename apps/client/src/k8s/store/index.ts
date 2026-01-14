import { create } from "zustand";
import { K8S_DEFAULT_CLUSTER_NAME, K8S_DEFAULT_CLUSTER_NAMESPACE } from "../constants";
import { LOCAL_STORAGE_SERVICE } from "../../core/services/local-storage";

interface ClusterSettings {
  [clusterName: string]: {
    default_namespace: string;
    allowed_namespaces: string[];
  };
}

interface ClusterStore {
  clusterName: string;
  setClusterName: (newClusterName: string) => void;
  defaultNamespace: string;
  setDefaultNamespace: (newDefaultNamespace: string) => void;
  allowedNamespaces: string[];
  setAllowedNamespaces: (newAllowedNamespaces: string[]) => void;
  sonarHostUrl: string;
  setSonarHostUrl: (newSonarHostUrl: string) => void;
  dependencyTrackUrl: string;
  setDependencyTrackUrl: (newDependencyTrackUrl: string) => void;
}

const LOCAL_STORAGE_KEY = "cluster_settings";

const getSettingsFromStorage = (): ClusterSettings => LOCAL_STORAGE_SERVICE.getItem(LOCAL_STORAGE_KEY) || {};

const saveSettingsToStorage = (settings: ClusterSettings) => {
  LOCAL_STORAGE_SERVICE.setItem(LOCAL_STORAGE_KEY, settings);
};

export const useClusterStore = create<ClusterStore>((set, get) => {
  const clusterName = K8S_DEFAULT_CLUSTER_NAME;
  const settings = getSettingsFromStorage();
  const clusterSettings = settings[clusterName] || {
    default_namespace: K8S_DEFAULT_CLUSTER_NAMESPACE,
    allowed_namespaces: [K8S_DEFAULT_CLUSTER_NAMESPACE],
  };

  if (!settings[clusterName]) {
    settings[clusterName] = {
      default_namespace: K8S_DEFAULT_CLUSTER_NAMESPACE,
      allowed_namespaces: [K8S_DEFAULT_CLUSTER_NAMESPACE],
    };
    saveSettingsToStorage(settings);
  }

  return {
    clusterName,
    setClusterName: (newClusterName) => {
      const settings = getSettingsFromStorage();
      const newClusterSettings = settings[newClusterName] || {
        default_namespace: K8S_DEFAULT_CLUSTER_NAMESPACE,
        allowed_namespaces: [K8S_DEFAULT_CLUSTER_NAMESPACE],
      };
      set({
        clusterName: newClusterName,
        defaultNamespace: newClusterSettings.default_namespace,
        allowedNamespaces: newClusterSettings.allowed_namespaces,
      });
    },

    defaultNamespace: clusterSettings.default_namespace,
    setDefaultNamespace: (newDefaultNamespace) => {
      const { clusterName } = get();
      const settings = getSettingsFromStorage();
      settings[clusterName] = {
        ...(settings[clusterName] || {}),
        default_namespace: newDefaultNamespace,
        allowed_namespaces: settings[clusterName]?.allowed_namespaces || [newDefaultNamespace],
      };
      saveSettingsToStorage(settings);
      set({ defaultNamespace: newDefaultNamespace });
    },

    allowedNamespaces: clusterSettings.allowed_namespaces,
    setAllowedNamespaces: (newAllowedNamespaces) => {
      const { clusterName } = get();
      const settings = getSettingsFromStorage();
      settings[clusterName] = {
        ...(settings[clusterName] || {}),
        allowed_namespaces: newAllowedNamespaces,
        default_namespace: settings[clusterName]?.default_namespace || newAllowedNamespaces[0],
      };
      saveSettingsToStorage(settings);
      set({ allowedNamespaces: newAllowedNamespaces });
    },

    sonarHostUrl: "",
    setSonarHostUrl: (newSonarHostUrl) => {
      set({ sonarHostUrl: newSonarHostUrl });
    },

    dependencyTrackUrl: "",
    setDependencyTrackUrl: (newDependencyTrackUrl) => {
      set({ dependencyTrackUrl: newDependencyTrackUrl });
    },
  };
});
