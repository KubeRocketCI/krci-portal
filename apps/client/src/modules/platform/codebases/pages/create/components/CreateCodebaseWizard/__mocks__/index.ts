import type { QueryClient } from "@tanstack/react-query";
import { gitProvider } from "@my-project/shared";

/**
 * Mock Git Servers for wizard testing
 */
export const mockGitServers = {
  gerrit: {
    apiVersion: "v2.krci.io/v1",
    kind: "GitServer",
    metadata: {
      name: "gerrit-main",
      namespace: "default",
    },
    spec: {
      gitHost: "gerrit.example.com",
      gitProvider: gitProvider.gerrit,
      gitUser: "git-user",
      httpsPort: 443,
      nameSshKeySecret: "gerrit-ssh-key",
      sshPort: 29418,
    },
    status: {
      connected: true,
      available: true,
    },
  },
  github: {
    apiVersion: "v2.krci.io/v1",
    kind: "GitServer",
    metadata: {
      name: "github-main",
      namespace: "default",
    },
    spec: {
      gitHost: "github.com",
      gitProvider: gitProvider.github,
      gitUser: "github-user",
      httpsPort: 443,
      nameSshKeySecret: "github-ssh-key",
      sshPort: 22,
    },
    status: {
      connected: true,
      available: true,
    },
  },
  gitlab: {
    apiVersion: "v2.krci.io/v1",
    kind: "GitServer",
    metadata: {
      name: "gitlab-main",
      namespace: "default",
    },
    spec: {
      gitHost: "gitlab.com",
      gitProvider: gitProvider.gitlab,
      gitUser: "gitlab-user",
      httpsPort: 443,
      nameSshKeySecret: "gitlab-ssh-key",
      sshPort: 22,
    },
    status: {
      connected: true,
      available: true,
    },
  },
};

/**
 * Mock Jira Servers for wizard testing
 */
export const mockJiraServers = {
  main: {
    apiVersion: "v2.krci.io/v1",
    kind: "JiraServer",
    metadata: {
      name: "jira-main",
      namespace: "default",
    },
    spec: {
      apiUrl: "https://jira.example.com/rest/api/2",
      credentialName: "jira-credentials",
      rootUrl: "https://jira.example.com",
    },
    status: {
      available: true,
    },
  },
  secondary: {
    apiVersion: "v2.krci.io/v1",
    kind: "JiraServer",
    metadata: {
      name: "jira-secondary",
      namespace: "default",
    },
    spec: {
      apiUrl: "https://jira2.example.com/rest/api/2",
      credentialName: "jira2-credentials",
      rootUrl: "https://jira2.example.com",
    },
    status: {
      available: true,
    },
  },
};

/**
 * Mock GitHub/GitLab organizations for owner dropdown
 */
export const mockGitOrganizations = [
  { name: "my-org" },
  { name: "another-org" },
  { name: "test-organization" },
  { name: "company-name" },
];

/**
 * Mock KRCI Config for API gateway URL
 */
export const mockKRCIConfig = {
  apiVersion: "v1",
  kind: "ConfigMap",
  metadata: {
    name: "krci-config",
    namespace: "default",
  },
  data: {
    api_gateway_url: "http://localhost:3000/api",
    cluster_name: "test-cluster",
  },
};

/**
 * Mock Templates for wizard testing
 */
export const mockTemplates = {
  reactApp: {
    apiVersion: "v2.krci.io/v1",
    kind: "Template",
    metadata: {
      name: "react-typescript-app",
      namespace: "default",
    },
    spec: {
      buildTool: "npm",
      category: "Frontend",
      description:
        "Modern React application with TypeScript, Vite, and TailwindCSS. Perfect for building responsive web applications with type safety.",
      displayName: "React TypeScript Application",
      framework: "react",
      language: "javascript",
      source: "https://github.com/example/react-typescript-template.git",
      type: "application",
      version: "1.0.0",
      maturity: "stable" as const,
      icon: [
        {
          base64data:
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mediatype: "image/png",
        },
      ],
    },
  },
  nodeApi: {
    apiVersion: "v2.krci.io/v1",
    kind: "Template",
    metadata: {
      name: "node-express-api",
      namespace: "default",
    },
    spec: {
      buildTool: "npm",
      category: "Backend",
      description:
        "RESTful API built with Express.js and TypeScript. Includes PostgreSQL integration, authentication, and comprehensive testing setup.",
      displayName: "Node.js Express API",
      framework: "express",
      language: "javascript",
      source: "https://github.com/example/node-express-template.git",
      type: "application",
      version: "1.0.0",
      maturity: "stable" as const,
    },
  },
  pythonApi: {
    apiVersion: "v2.krci.io/v1",
    kind: "Template",
    metadata: {
      name: "python-fastapi",
      namespace: "default",
    },
    spec: {
      buildTool: "python",
      category: "Backend",
      description:
        "High-performance Python API using FastAPI framework. Features async support, automatic OpenAPI documentation, and Pydantic data validation.",
      displayName: "Python FastAPI Service",
      framework: "fastapi",
      language: "python",
      source: "https://github.com/example/python-fastapi-template.git",
      type: "application",
      version: "1.0.0",
      maturity: "beta" as const,
    },
  },
  cypressTests: {
    apiVersion: "v2.krci.io/v1",
    kind: "Template",
    metadata: {
      name: "cypress-e2e-tests",
      namespace: "default",
    },
    spec: {
      buildTool: "npm",
      category: "Testing",
      description:
        "Comprehensive end-to-end testing suite powered by Cypress. Includes visual regression testing and CI/CD integration examples.",
      displayName: "Cypress E2E Tests",
      framework: "none",
      language: "javascript",
      source: "https://github.com/example/cypress-template.git",
      type: "autotest",
      version: "1.0.0",
      maturity: "stable" as const,
    },
  },
};

/**
 * Seeds the QueryClient cache with mock data for wizard testing
 */
export const seedWizardMockData = (queryClient: QueryClient) => {
  const clusterName = "in-cluster"; // Must match TEST_CLUSTER_NAME
  const namespace = "default";

  // Mock Git Servers list (stored as Map)
  const gitServersMap = new Map(Object.values(mockGitServers).map((server) => [server.metadata.name, server]));

  const gitServersQueryKey = ["k8s:watchList", clusterName, namespace, "gitservers"];

  queryClient.setQueryData(gitServersQueryKey, {
    apiVersion: "v2.krci.io/v1",
    kind: "GitServerList",
    metadata: {},
    items: gitServersMap,
  });

  // Mock individual Git Server watches
  Object.values(mockGitServers).forEach((gitServer) => {
    queryClient.setQueryData(
      ["k8s:watchItem", clusterName, namespace, "gitservers", gitServer.metadata.name],
      gitServer
    );
  });

  // Mock Jira Servers list (stored as Map)
  const jiraServersMap = new Map(Object.values(mockJiraServers).map((server) => [server.metadata.name, server]));

  const jiraServersQueryKey = ["k8s:watchList", clusterName, namespace, "jiraservers"];

  queryClient.setQueryData(jiraServersQueryKey, {
    apiVersion: "v2.krci.io/v1",
    kind: "JiraServerList",
    metadata: {},
    items: jiraServersMap,
  });

  // Mock individual Jira Server watches
  Object.values(mockJiraServers).forEach((jiraServer) => {
    queryClient.setQueryData(
      ["k8s:watchItem", clusterName, namespace, "jiraservers", jiraServer.metadata.name],
      jiraServer
    );
  });

  // Mock Git Organizations (for non-Gerrit servers) - TRPC query
  queryClient.setQueryData(["gitServerOrgList", "github-main"], {
    data: mockGitOrganizations,
  });

  queryClient.setQueryData(["gitServerOrgList", "gitlab-main"], {
    data: mockGitOrganizations,
  });

  // Mock Templates list (stored as Map)
  const templatesMap = new Map(Object.values(mockTemplates).map((template) => [template.metadata.name, template]));

  const templatesQueryKey = ["k8s:watchList", clusterName, namespace, "templates"];

  queryClient.setQueryData(templatesQueryKey, {
    apiVersion: "v2.krci.io/v1",
    kind: "TemplateList",
    metadata: {},
    items: templatesMap,
  });

  // Mock individual Template watches
  Object.values(mockTemplates).forEach((template) => {
    queryClient.setQueryData(["k8s:watchItem", clusterName, namespace, "templates", template.metadata.name], template);
  });

  // Mock KRCI Config
  queryClient.setQueryData(["k8s:watchItem", clusterName, namespace, "configmaps", "krci-config"], mockKRCIConfig);
};

/**
 * Creates a decorator with wizard mock data pre-seeded
 */
export const withWizardMocks = () => {
  return {
    seedQueryCache: seedWizardMockData,
  };
};
