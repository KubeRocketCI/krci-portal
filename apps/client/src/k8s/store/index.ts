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
  clusterNameResolved: boolean;
  defaultNamespace: string;
  setDefaultNamespace: (newDefaultNamespace: string) => void;
  allowedNamespaces: string[];
  setAllowedNamespaces: (newAllowedNamespaces: string[]) => void;
  sonarWebUrl: string;
  setSonarWebUrl: (newSonarWebUrl: string) => void;
  dependencyTrackWebUrl: string;
  setDependencyTrackWebUrl: (newDependencyTrackWebUrl: string) => void;
}

const LOCAL_STORAGE_KEY = "cluster_settings";

const getSettingsFromStorage = (): ClusterSettings => LOCAL_STORAGE_SERVICE.getItem(LOCAL_STORAGE_KEY) || {};

const saveSettingsToStorage = (settings: ClusterSettings) => {
  LOCAL_STORAGE_SERVICE.setItem(LOCAL_STORAGE_KEY, settings);
};

// Cluster name and default namespace come from the server's DEFAULT_CLUSTER_* env
// vars at runtime (via ConfigProvider); the build-time VITE_* constants are dev-only
// fallbacks, normally undefined in production. Coerce to "" and never persist under an
// empty cluster name — an undefined fallback used to seed a bogus `{"undefined": …}` entry.
const FALLBACK_CLUSTER_NAME = K8S_DEFAULT_CLUSTER_NAME || "";
const FALLBACK_NAMESPACE = K8S_DEFAULT_CLUSTER_NAMESPACE || "";
const seedAllowedNamespaces = (namespace: string): string[] => (namespace ? [namespace] : []);

export const useClusterStore = create<ClusterStore>((set, get) => {
  const clusterName = FALLBACK_CLUSTER_NAME;
  const settings = getSettingsFromStorage();
  const persisted = clusterName ? settings[clusterName] : undefined;

  const defaultNamespace = persisted?.default_namespace ?? FALLBACK_NAMESPACE;
  const allowedNamespaces = persisted?.allowed_namespaces ?? seedAllowedNamespaces(FALLBACK_NAMESPACE);

  // Seed only for a known cluster with nothing stored yet (see note above).
  if (clusterName && !persisted) {
    settings[clusterName] = {
      default_namespace: defaultNamespace,
      allowed_namespaces: allowedNamespaces,
    };
    saveSettingsToStorage(settings);
  }

  return {
    clusterName,
    setClusterName: (newClusterName) => {
      const settings = getSettingsFromStorage();
      const persisted = settings[newClusterName];
      set({
        clusterName: newClusterName,
        defaultNamespace: persisted?.default_namespace ?? FALLBACK_NAMESPACE,
        allowedNamespaces: persisted?.allowed_namespaces ?? seedAllowedNamespaces(FALLBACK_NAMESPACE),
        clusterNameResolved: true,
      });
    },

    clusterNameResolved: !!clusterName,

    defaultNamespace,
    setDefaultNamespace: (newDefaultNamespace) => {
      const { clusterName, allowedNamespaces, defaultNamespace } = get();
      const settings = getSettingsFromStorage();
      const currentAllowedNamespaces = settings[clusterName]?.allowed_namespaces || allowedNamespaces;
      const currentDefaultNamespace = settings[clusterName]?.default_namespace || defaultNamespace;

      // Replace old default namespace with new one in allowed namespaces array
      const updatedAllowedNamespaces = currentAllowedNamespaces.map((ns) =>
        ns === currentDefaultNamespace ? newDefaultNamespace : ns
      );

      // If the old default wasn't in the array, just add the new one
      if (!currentAllowedNamespaces.includes(currentDefaultNamespace)) {
        updatedAllowedNamespaces.push(newDefaultNamespace);
      }

      settings[clusterName] = {
        ...(settings[clusterName] || {}),
        default_namespace: newDefaultNamespace,
        allowed_namespaces: updatedAllowedNamespaces,
      };
      saveSettingsToStorage(settings);
      set({
        defaultNamespace: newDefaultNamespace,
        allowedNamespaces: updatedAllowedNamespaces,
      });
    },

    allowedNamespaces,
    setAllowedNamespaces: (newAllowedNamespaces) => {
      const { clusterName } = get();
      const settings = getSettingsFromStorage();

      // Check if there's a stored default namespace in localStorage
      const hasStoredDefault = settings[clusterName]?.default_namespace !== undefined;
      const storedDefault = settings[clusterName]?.default_namespace;

      // Only update default namespace if there's no stored default in localStorage
      // If there's a stored default, preserve it even if not in new allowed list
      const updatedDefaultNamespace = hasStoredDefault ? storedDefault : newAllowedNamespaces[0];

      settings[clusterName] = {
        ...(settings[clusterName] || {}),
        allowed_namespaces: newAllowedNamespaces,
        default_namespace: updatedDefaultNamespace,
      };
      saveSettingsToStorage(settings);

      // Update state - only change defaultNamespace if there was no stored default
      const stateUpdate: Partial<ClusterStore> = {
        allowedNamespaces: newAllowedNamespaces,
      };

      if (!hasStoredDefault) {
        stateUpdate.defaultNamespace = updatedDefaultNamespace;
      }

      set(stateUpdate);
    },

    sonarWebUrl: "",
    setSonarWebUrl: (newSonarWebUrl) => {
      set({ sonarWebUrl: newSonarWebUrl });
    },

    dependencyTrackWebUrl: "",
    setDependencyTrackWebUrl: (newDependencyTrackWebUrl) => {
      set({ dependencyTrackWebUrl: newDependencyTrackWebUrl });
    },
  };
});
