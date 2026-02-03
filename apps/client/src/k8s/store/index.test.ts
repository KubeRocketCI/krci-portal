import { describe, it, expect, beforeEach, vi } from "vitest";
import { useClusterStore } from "./index";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";

// Mock constants - defined inline to avoid hoisting issues
vi.mock("../constants", () => ({
  K8S_DEFAULT_CLUSTER_NAME: "in-cluster",
  K8S_DEFAULT_CLUSTER_NAMESPACE: "default",
}));

const MOCK_DEFAULT_CLUSTER_NAME = "in-cluster";
const MOCK_DEFAULT_NAMESPACE = "default";

// Mock local storage service
vi.mock("@/core/services/local-storage", () => ({
  LOCAL_STORAGE_SERVICE: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("useClusterStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset store to initial state
    useClusterStore.setState({
      clusterName: MOCK_DEFAULT_CLUSTER_NAME,
      defaultNamespace: MOCK_DEFAULT_NAMESPACE,
      allowedNamespaces: [MOCK_DEFAULT_NAMESPACE],
      sonarWebUrl: "",
      dependencyTrackWebUrl: "",
    });
  });

  describe("Initial State", () => {
    it("should initialize with default cluster name", () => {
      const clusterName = useClusterStore.getState().clusterName;
      expect(clusterName).toBe(MOCK_DEFAULT_CLUSTER_NAME);
    });

    it("should have default namespace set", () => {
      const store = useClusterStore.getState();
      expect(store.defaultNamespace).toBeDefined();
      expect(typeof store.defaultNamespace).toBe("string");
    });

    it("should have allowed namespaces set", () => {
      const store = useClusterStore.getState();
      expect(store.allowedNamespaces).toBeDefined();
      expect(Array.isArray(store.allowedNamespaces)).toBe(true);
      expect(store.allowedNamespaces.length).toBeGreaterThan(0);
    });

    it("should initialize sonarWebUrl as empty string", () => {
      const sonarWebUrl = useClusterStore.getState().sonarWebUrl;
      expect(sonarWebUrl).toBe("");
    });

    it("should initialize dependencyTrackWebUrl as empty string", () => {
      const dependencyTrackWebUrl = useClusterStore.getState().dependencyTrackWebUrl;
      expect(dependencyTrackWebUrl).toBe("");
    });
  });

  describe("setClusterName", () => {
    it("should update cluster name and load settings from localStorage", () => {
      const newClusterName = "new-cluster";
      const clusterSettings = {
        [newClusterName]: {
          default_namespace: "new-namespace",
          allowed_namespaces: ["new-namespace", "other"],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(clusterSettings);

      useClusterStore.getState().setClusterName(newClusterName);

      const state = useClusterStore.getState();
      expect(state.clusterName).toBe(newClusterName);
      expect(state.defaultNamespace).toBe("new-namespace");
      expect(state.allowedNamespaces).toEqual(["new-namespace", "other"]);
    });

    it("should use default settings when cluster settings don't exist in localStorage", () => {
      const newClusterName = "non-existent-cluster";
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue({});

      useClusterStore.getState().setClusterName(newClusterName);

      const state = useClusterStore.getState();
      expect(state.clusterName).toBe(newClusterName);
      expect(state.defaultNamespace).toBe(MOCK_DEFAULT_NAMESPACE);
      expect(state.allowedNamespaces).toEqual([MOCK_DEFAULT_NAMESPACE]);
    });

    it("should handle multiple cluster switches", () => {
      const cluster1Settings = {
        cluster1: {
          default_namespace: "ns1",
          allowed_namespaces: ["ns1"],
        },
        cluster2: {
          default_namespace: "ns2",
          allowed_namespaces: ["ns2", "ns2-other"],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(cluster1Settings);

      useClusterStore.getState().setClusterName("cluster1");
      expect(useClusterStore.getState().clusterName).toBe("cluster1");
      expect(useClusterStore.getState().defaultNamespace).toBe("ns1");

      useClusterStore.getState().setClusterName("cluster2");
      expect(useClusterStore.getState().clusterName).toBe("cluster2");
      expect(useClusterStore.getState().defaultNamespace).toBe("ns2");
      expect(useClusterStore.getState().allowedNamespaces).toEqual(["ns2", "ns2-other"]);
    });
  });

  describe("setDefaultNamespace", () => {
    it("should update default namespace and persist to localStorage", () => {
      const newNamespace = "new-namespace";
      const currentClusterName = useClusterStore.getState().clusterName;
      const existingSettings = {
        [currentClusterName]: {
          default_namespace: MOCK_DEFAULT_NAMESPACE,
          allowed_namespaces: [MOCK_DEFAULT_NAMESPACE],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(existingSettings);

      useClusterStore.getState().setDefaultNamespace(newNamespace);

      const state = useClusterStore.getState();
      expect(state.defaultNamespace).toBe(newNamespace);

      // Verify localStorage was updated
      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        "cluster_settings",
        expect.objectContaining({
          [currentClusterName]: expect.objectContaining({
            default_namespace: newNamespace,
          }),
        })
      );
    });

    it("should update allowed namespaces to include new default if not present", () => {
      const newNamespace = "new-namespace";
      const currentClusterName = useClusterStore.getState().clusterName;
      const existingSettings = {
        [currentClusterName]: {
          default_namespace: MOCK_DEFAULT_NAMESPACE,
          allowed_namespaces: [MOCK_DEFAULT_NAMESPACE],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(existingSettings);

      useClusterStore.getState().setDefaultNamespace(newNamespace);

      const state = useClusterStore.getState();
      expect(state.defaultNamespace).toBe(newNamespace);
      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        "cluster_settings",
        expect.objectContaining({
          [currentClusterName]: expect.objectContaining({
            allowed_namespaces: [newNamespace],
          }),
        })
      );
    });

    it("should preserve existing allowed namespaces when updating default", () => {
      const newNamespace = "new-namespace";
      const currentClusterName = useClusterStore.getState().clusterName;
      const existingSettings = {
        [currentClusterName]: {
          default_namespace: MOCK_DEFAULT_NAMESPACE,
          allowed_namespaces: ["existing-ns", MOCK_DEFAULT_NAMESPACE],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(existingSettings);

      useClusterStore.getState().setDefaultNamespace(newNamespace);

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        "cluster_settings",
        expect.objectContaining({
          [currentClusterName]: expect.objectContaining({
            allowed_namespaces: ["existing-ns", newNamespace],
          }),
        })
      );
    });

    it("should create settings entry if cluster doesn't exist in localStorage", () => {
      const newNamespace = "new-namespace";
      const currentClusterName = useClusterStore.getState().clusterName;
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue({});

      useClusterStore.getState().setDefaultNamespace(newNamespace);

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        "cluster_settings",
        expect.objectContaining({
          [currentClusterName]: expect.objectContaining({
            default_namespace: newNamespace,
          }),
        })
      );
    });
  });

  describe("setAllowedNamespaces", () => {
    it("should update allowed namespaces and persist to localStorage", () => {
      const newNamespaces = ["ns1", "ns2", "ns3"];
      const currentClusterName = useClusterStore.getState().clusterName;
      const existingSettings = {
        [currentClusterName]: {
          default_namespace: MOCK_DEFAULT_NAMESPACE,
          allowed_namespaces: [MOCK_DEFAULT_NAMESPACE],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(existingSettings);

      useClusterStore.getState().setAllowedNamespaces(newNamespaces);

      const state = useClusterStore.getState();
      expect(state.allowedNamespaces).toEqual(newNamespaces);

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        "cluster_settings",
        expect.objectContaining({
          [currentClusterName]: expect.objectContaining({
            allowed_namespaces: newNamespaces,
          }),
        })
      );
    });

    it("should update default namespace to first allowed namespace if not set", () => {
      const newNamespaces = ["ns1", "ns2"];
      const currentClusterName = useClusterStore.getState().clusterName;
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue({});

      useClusterStore.getState().setAllowedNamespaces(newNamespaces);

      const state = useClusterStore.getState();
      expect(state.allowedNamespaces).toEqual(newNamespaces);
      expect(state.defaultNamespace).toBe("ns1");

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        "cluster_settings",
        expect.objectContaining({
          [currentClusterName]: expect.objectContaining({
            default_namespace: "ns1",
          }),
        })
      );
    });

    it("should preserve existing default namespace when updating allowed namespaces", () => {
      const newNamespaces = ["ns1", "ns2"];
      const currentClusterName = useClusterStore.getState().clusterName;
      const existingSettings = {
        [currentClusterName]: {
          default_namespace: "existing-default",
          allowed_namespaces: ["old-ns"],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(existingSettings);

      useClusterStore.getState().setAllowedNamespaces(newNamespaces);

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith(
        "cluster_settings",
        expect.objectContaining({
          [currentClusterName]: expect.objectContaining({
            default_namespace: "existing-default",
          }),
        })
      );
    });

    it("should handle empty allowed namespaces array", () => {
      const emptyNamespaces: string[] = [];
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue({});

      useClusterStore.getState().setAllowedNamespaces(emptyNamespaces);

      const state = useClusterStore.getState();
      expect(state.allowedNamespaces).toEqual(emptyNamespaces);
    });
  });

  describe("setSonarWebUrl", () => {
    it("should update sonarWebUrl", () => {
      const newUrl = "https://sonar.example.com";

      useClusterStore.getState().setSonarWebUrl(newUrl);

      const state = useClusterStore.getState();
      expect(state.sonarWebUrl).toBe(newUrl);
    });

    it("should update sonarWebUrl multiple times", () => {
      const url1 = "https://sonar1.example.com";
      const url2 = "https://sonar2.example.com";

      useClusterStore.getState().setSonarWebUrl(url1);
      expect(useClusterStore.getState().sonarWebUrl).toBe(url1);

      useClusterStore.getState().setSonarWebUrl(url2);
      expect(useClusterStore.getState().sonarWebUrl).toBe(url2);
    });

    it("should handle empty string", () => {
      useClusterStore.getState().setSonarWebUrl("");

      const state = useClusterStore.getState();
      expect(state.sonarWebUrl).toBe("");
    });
  });

  describe("setDependencyTrackWebUrl", () => {
    it("should update dependencyTrackWebUrl", () => {
      const newUrl = "https://dependency-track.example.com";

      useClusterStore.getState().setDependencyTrackWebUrl(newUrl);

      const state = useClusterStore.getState();
      expect(state.dependencyTrackWebUrl).toBe(newUrl);
    });

    it("should update dependencyTrackWebUrl multiple times", () => {
      const url1 = "https://dt1.example.com";
      const url2 = "https://dt2.example.com";

      useClusterStore.getState().setDependencyTrackWebUrl(url1);
      expect(useClusterStore.getState().dependencyTrackWebUrl).toBe(url1);

      useClusterStore.getState().setDependencyTrackWebUrl(url2);
      expect(useClusterStore.getState().dependencyTrackWebUrl).toBe(url2);
    });

    it("should handle empty string", () => {
      useClusterStore.getState().setDependencyTrackWebUrl("");

      const state = useClusterStore.getState();
      expect(state.dependencyTrackWebUrl).toBe("");
    });
  });

  describe("LocalStorage Persistence", () => {
    it("should save settings to localStorage when setDefaultNamespace is called", () => {
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue({});

      useClusterStore.getState().setDefaultNamespace("new-ns");

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith("cluster_settings", expect.any(Object));
    });

    it("should save settings to localStorage when setAllowedNamespaces is called", () => {
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue({});

      useClusterStore.getState().setAllowedNamespaces(["ns1", "ns2"]);

      expect(LOCAL_STORAGE_SERVICE.setItem).toHaveBeenCalledWith("cluster_settings", expect.any(Object));
    });

    it("should load settings from localStorage when setClusterName is called", () => {
      const clusterSettings = {
        "test-cluster": {
          default_namespace: "test-ns",
          allowed_namespaces: ["test-ns"],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(clusterSettings);

      useClusterStore.getState().setClusterName("test-cluster");

      expect(LOCAL_STORAGE_SERVICE.getItem).toHaveBeenCalledWith("cluster_settings");
    });

    it("should merge existing settings when updating", () => {
      const currentClusterName = useClusterStore.getState().clusterName;
      const existingSettings = {
        [currentClusterName]: {
          default_namespace: "existing-ns",
          allowed_namespaces: ["existing-ns", "other"],
        },
        otherCluster: {
          default_namespace: "other-ns",
          allowed_namespaces: ["other-ns"],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(existingSettings);

      useClusterStore.getState().setDefaultNamespace("updated-ns");

      // Verify that other cluster settings are preserved
      const setItemCall = vi.mocked(LOCAL_STORAGE_SERVICE.setItem).mock.calls[0];
      const savedSettings = setItemCall[1] as Record<string, unknown>;
      expect(savedSettings.otherCluster).toEqual(existingSettings.otherCluster);
      expect(savedSettings[currentClusterName]).toEqual(
        expect.objectContaining({
          default_namespace: "updated-ns",
        })
      );
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete workflow: switch cluster, update namespace, update allowed namespaces", () => {
      const cluster1Settings = {
        cluster1: {
          default_namespace: "ns1",
          allowed_namespaces: ["ns1"],
        },
        cluster2: {
          default_namespace: "ns2",
          allowed_namespaces: ["ns2"],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(cluster1Settings);

      // Switch to cluster1
      useClusterStore.getState().setClusterName("cluster1");
      expect(useClusterStore.getState().clusterName).toBe("cluster1");
      expect(useClusterStore.getState().defaultNamespace).toBe("ns1");

      // Update namespace
      useClusterStore.getState().setDefaultNamespace("updated-ns1");
      expect(useClusterStore.getState().defaultNamespace).toBe("updated-ns1");

      // Update allowed namespaces
      useClusterStore.getState().setAllowedNamespaces(["updated-ns1", "new-ns"]);
      expect(useClusterStore.getState().allowedNamespaces).toEqual(["updated-ns1", "new-ns"]);

      // Switch to cluster2
      useClusterStore.getState().setClusterName("cluster2");
      expect(useClusterStore.getState().clusterName).toBe("cluster2");
      expect(useClusterStore.getState().defaultNamespace).toBe("ns2");

      // Verify cluster1 settings were preserved
      const setItemCalls = vi.mocked(LOCAL_STORAGE_SERVICE.setItem).mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      const savedSettings = lastCall[1] as Record<string, unknown>;
      expect(savedSettings.cluster1).toEqual({
        default_namespace: "updated-ns1",
        allowed_namespaces: ["updated-ns1", "new-ns"],
      });
    });

    it("should maintain separate URL settings across cluster switches", () => {
      useClusterStore.getState().setSonarWebUrl("https://sonar.example.com");
      useClusterStore.getState().setDependencyTrackWebUrl("https://dt.example.com");

      const clusterSettings = {
        newCluster: {
          default_namespace: "ns",
          allowed_namespaces: ["ns"],
        },
      };
      vi.mocked(LOCAL_STORAGE_SERVICE.getItem).mockReturnValue(clusterSettings);

      useClusterStore.getState().setClusterName("newCluster");

      // URLs should persist across cluster switches (they're not cluster-specific)
      expect(useClusterStore.getState().sonarWebUrl).toBe("https://sonar.example.com");
      expect(useClusterStore.getState().dependencyTrackWebUrl).toBe("https://dt.example.com");
    });
  });
});
