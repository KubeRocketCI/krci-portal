import { describe, it, expect } from "vitest";
import { editJiraServer } from "./index.js";
import { JiraServer, k8sJiraServerConfig } from "../../../../groups/KRCI/index.js";
import { ZodError } from "zod";
import { KubeMetadata } from "../../../../common/types.js";

describe("editJiraServer", () => {
  const createExistingJiraServer = (): JiraServer => ({
    apiVersion: `${k8sJiraServerConfig.group}/${k8sJiraServerConfig.version}`,
    kind: k8sJiraServerConfig.kind,
    metadata: {
      name: "epam-jira",
      namespace: "default",
      resourceVersion: "12345",
    } as unknown as KubeMetadata,
    spec: {
      apiUrl: "https://old-jira.example.com",
      rootUrl: "https://old-jira.example.com",
      credentialName: "ci-jira",
    },
  });

  it("should update URL while preserving other fields", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: "https://new-jira.example.com",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec.apiUrl).toBe("https://new-jira.example.com");
    expect(result.spec.rootUrl).toBe("https://new-jira.example.com");
    expect(result.spec.credentialName).toBe("ci-jira");

    expect(result.metadata.name).toBe("epam-jira");
    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.resourceVersion).toBe("12345");

    expect(existingJiraServer.spec.apiUrl).toBe("https://old-jira.example.com");
  });

  it("should throw ZodError when url is missing", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {} as any;

    expect(() => editJiraServer(existingJiraServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is not a string", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: 123,
    } as any;

    expect(() => editJiraServer(existingJiraServer, input)).toThrow(ZodError);
  });

  it("should create spec object if it doesn't exist", () => {
    const existingJiraServer: JiraServer = {
      apiVersion: `${k8sJiraServerConfig.group}/${k8sJiraServerConfig.version}`,
      kind: k8sJiraServerConfig.kind,
      metadata: {
        name: "epam-jira",
      },
    } as any;

    const input = {
      url: "https://jira.example.com",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec).toBeDefined();
    expect(result.spec.apiUrl).toBe("https://jira.example.com");
    expect(result.spec.rootUrl).toBe("https://jira.example.com");
  });

  it("should handle URLs with ports", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: "https://jira.example.com:8443",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec.apiUrl).toBe("https://jira.example.com:8443");
    expect(result.spec.rootUrl).toBe("https://jira.example.com:8443");
  });

  it("should handle URLs with paths", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: "https://jira.example.com/jira/api",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec.apiUrl).toBe("https://jira.example.com/jira/api");
  });

  it("should handle minimal URL", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: "http://localhost",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec.apiUrl).toBe("http://localhost");
    expect(result.spec.rootUrl).toBe("http://localhost");
  });

  it("should not modify the original JiraServer object", () => {
    const existingJiraServer = createExistingJiraServer();
    const originalApiUrl = existingJiraServer.spec.apiUrl;
    const originalRootUrl = existingJiraServer.spec.rootUrl;

    const input = {
      url: "https://modified-jira.example.com",
    };

    editJiraServer(existingJiraServer, input);

    expect(existingJiraServer.spec.apiUrl).toBe(originalApiUrl);
    expect(existingJiraServer.spec.rootUrl).toBe(originalRootUrl);
  });

  it("should throw ZodError when url is null", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: null,
    } as any;

    expect(() => editJiraServer(existingJiraServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is undefined", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: undefined,
    } as any;

    expect(() => editJiraServer(existingJiraServer, input)).toThrow(ZodError);
  });

  it("should preserve metadata without modifications", () => {
    const existingJiraServer: JiraServer = {
      apiVersion: `${k8sJiraServerConfig.group}/${k8sJiraServerConfig.version}`,
      kind: k8sJiraServerConfig.kind,
      metadata: {
        name: "epam-jira",
        namespace: "production",
        labels: {
          "app.kubernetes.io/name": "jira",
          "custom-label": "custom-value",
        },
        annotations: {
          "annotation-1": "value-1",
        },
        resourceVersion: "54321",
        uid: "test-uid-456",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
      spec: {
        apiUrl: "https://old-jira.example.com",
        rootUrl: "https://old-jira.example.com",
        credentialName: "ci-jira",
      },
    };

    const input = {
      url: "https://new-jira.example.com",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.metadata).toEqual(existingJiraServer.metadata);
    expect(result.metadata.resourceVersion).toBe("54321");
    expect(result.metadata.uid).toBe("test-uid-456");
  });

  it("should handle very long URLs", () => {
    const existingJiraServer = createExistingJiraServer();
    const longPath = "/path".repeat(100);

    const input = {
      url: `https://jira.example.com${longPath}`,
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec.apiUrl).toBe(`https://jira.example.com${longPath}`);
    expect(result.spec.rootUrl).toBe(`https://jira.example.com${longPath}`);
  });

  it("should handle URLs with query parameters", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: "https://jira.example.com/api?key=value&param=123",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec.apiUrl).toBe("https://jira.example.com/api?key=value&param=123");
  });

  it("should handle localhost URLs", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: "http://localhost:8080",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec.apiUrl).toBe("http://localhost:8080");
    expect(result.spec.rootUrl).toBe("http://localhost:8080");
  });

  it("should preserve credentialName field", () => {
    const existingJiraServer = createExistingJiraServer();

    const input = {
      url: "https://new-jira.example.com",
    };

    const result = editJiraServer(existingJiraServer, input);

    expect(result.spec.credentialName).toBe("ci-jira");
  });
});
