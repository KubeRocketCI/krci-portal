import type { Meta, StoryObj } from "@storybook/react-vite";
import { PipelineRunList } from "./index";
import { FilterProvider } from "@/core/providers/Filter/provider";
import {
  PipelineRun,
  pipelineRunLabels,
  pipelineType,
  tektonResultAnnotations,
  k8sPipelineRunConfig,
} from "@my-project/shared";
import { matchFunctions, pipelineRunFilterControlNames } from "./components/Filter/constants";
import { PipelineRunListFilterValues } from "./components/Filter/types";
import { getK8sItemPermissionsQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";
import { withAppProviders, mockPermissions, STORYBOOK_CLUSTER_NAME, STORYBOOK_NAMESPACE } from "@sb/index";
import React from "react";

// Helper to create mock PipelineRun data
const createMockPipelineRun = (overrides: {
  name: string;
  pipelineType: string;
  status: "succeeded" | "failed" | "running" | "unknown";
  codebase?: string;
  branch?: string;
  pipelineName?: string;
  author?: string;
  pullRequest?: { number: string; url?: string };
  vcsTag?: string;
  startTime?: string;
  completionTime?: string;
  namespace?: string;
}): PipelineRun => {
  const now = new Date();
  const startTime = overrides.startTime || new Date(now.getTime() - 300000).toISOString(); // 5 minutes ago
  const completionTime =
    overrides.status === "running"
      ? undefined
      : overrides.completionTime || new Date(now.getTime() - 60000).toISOString();

  const statusCondition = {
    succeeded: { status: "True", reason: "Succeeded" },
    failed: { status: "False", reason: "Failed" },
    running: { status: "Unknown", reason: "Running" },
    unknown: { status: "Unknown", reason: "Unknown" },
  }[overrides.status];

  return {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name: overrides.name,
      namespace: overrides.namespace || "default",
      uid: `uid-${overrides.name}`,
      creationTimestamp: startTime,
      labels: {
        [pipelineRunLabels.pipelineType]: overrides.pipelineType,
        ...(overrides.codebase && { [pipelineRunLabels.codebase]: overrides.codebase }),
        ...(overrides.branch && { [pipelineRunLabels.codebaseBranch]: overrides.branch }),
        ...(overrides.pipelineName && { [pipelineRunLabels.pipeline]: overrides.pipelineName }),
      },
      annotations: {
        ...(overrides.branch && { [tektonResultAnnotations.gitBranch]: overrides.branch }),
        ...(overrides.author && { [tektonResultAnnotations.gitAuthor]: overrides.author }),
        ...(overrides.pullRequest && { [tektonResultAnnotations.gitChangeNumber]: overrides.pullRequest.number }),
        ...(overrides.pullRequest?.url && { [tektonResultAnnotations.gitChangeUrl]: overrides.pullRequest.url }),
      },
    },
    spec: {
      pipelineRef: {
        name: overrides.pipelineName || `pipeline-${overrides.pipelineType}`,
      },
      params: [],
    },
    status: {
      startTime,
      completionTime,
      conditions: [
        {
          type: "Succeeded",
          status: statusCondition.status,
          reason: statusCondition.reason as
            | "started"
            | "running"
            | "cancelled"
            | "succeeded"
            | "completed"
            | "failed"
            | "pipelineruntimeout"
            | "createrunfailed",
          message: `Pipeline run ${statusCondition.reason.toLowerCase()}`,
          lastTransitionTime: completionTime || startTime,
        },
      ],
      results: overrides.vcsTag
        ? [
            {
              name: "VCS_TAG",
              value: overrides.vcsTag,
            },
          ]
        : [],
    },
  } as PipelineRun;
};

// Generate a set of mock pipeline runs for different scenarios
const generateMockPipelineRuns = (): PipelineRun[] => [
  // Build pipelines
  createMockPipelineRun({
    name: "my-app-build-abc123",
    pipelineType: pipelineType.build,
    status: "succeeded",
    codebase: "my-app",
    branch: "main",
    pipelineName: "build-pipeline",
    author: "john.doe",
    vcsTag: "1.0.0-SNAPSHOT.1",
    startTime: new Date(Date.now() - 600000).toISOString(),
    completionTime: new Date(Date.now() - 300000).toISOString(),
  }),
  createMockPipelineRun({
    name: "my-app-build-def456",
    pipelineType: pipelineType.build,
    status: "failed",
    codebase: "my-app",
    branch: "feature/new-feature",
    pipelineName: "build-pipeline",
    author: "jane.smith",
    startTime: new Date(Date.now() - 900000).toISOString(),
    completionTime: new Date(Date.now() - 800000).toISOString(),
  }),
  createMockPipelineRun({
    name: "my-app-build-ghi789",
    pipelineType: pipelineType.build,
    status: "running",
    codebase: "my-app",
    branch: "develop",
    pipelineName: "build-pipeline",
    author: "bob.wilson",
    startTime: new Date(Date.now() - 120000).toISOString(),
  }),

  // Review pipelines
  createMockPipelineRun({
    name: "my-app-review-pr123",
    pipelineType: pipelineType.review,
    status: "succeeded",
    codebase: "my-app",
    branch: "feature/auth",
    pipelineName: "review-pipeline",
    author: "alice.johnson",
    pullRequest: { number: "123", url: "https://github.com/org/repo/pull/123" },
    startTime: new Date(Date.now() - 1200000).toISOString(),
    completionTime: new Date(Date.now() - 1100000).toISOString(),
  }),
  createMockPipelineRun({
    name: "my-app-review-pr456",
    pipelineType: pipelineType.review,
    status: "failed",
    codebase: "another-service",
    branch: "feature/api",
    pipelineName: "review-pipeline",
    author: "charlie.brown",
    pullRequest: { number: "456", url: "https://github.com/org/repo/pull/456" },
    startTime: new Date(Date.now() - 1500000).toISOString(),
    completionTime: new Date(Date.now() - 1400000).toISOString(),
  }),

  // Deploy pipelines
  createMockPipelineRun({
    name: "deploy-dev-abc123",
    pipelineType: pipelineType.deploy,
    status: "succeeded",
    codebase: "my-app",
    pipelineName: "deploy-pipeline",
    vcsTag: "1.0.0",
    startTime: new Date(Date.now() - 1800000).toISOString(),
    completionTime: new Date(Date.now() - 1700000).toISOString(),
  }),
  createMockPipelineRun({
    name: "deploy-staging-def456",
    pipelineType: pipelineType.deploy,
    status: "running",
    codebase: "my-app",
    pipelineName: "deploy-pipeline",
    vcsTag: "1.0.1",
    startTime: new Date(Date.now() - 180000).toISOString(),
  }),

  // Clean pipelines
  createMockPipelineRun({
    name: "clean-dev-xyz789",
    pipelineType: pipelineType.clean,
    status: "succeeded",
    pipelineName: "clean-pipeline",
    startTime: new Date(Date.now() - 2400000).toISOString(),
    completionTime: new Date(Date.now() - 2300000).toISOString(),
  }),

  // Security pipelines
  createMockPipelineRun({
    name: "security-scan-abc123",
    pipelineType: pipelineType.security,
    status: "succeeded",
    codebase: "my-app",
    branch: "main",
    pipelineName: "security-pipeline",
    author: "security-bot",
    startTime: new Date(Date.now() - 3600000).toISOString(),
    completionTime: new Date(Date.now() - 3500000).toISOString(),
  }),

  // Release pipelines
  createMockPipelineRun({
    name: "release-v1.0.0",
    pipelineType: pipelineType.release,
    status: "succeeded",
    codebase: "my-app",
    branch: "main",
    pipelineName: "release-pipeline",
    author: "release-manager",
    vcsTag: "v1.0.0",
    startTime: new Date(Date.now() - 7200000).toISOString(),
    completionTime: new Date(Date.now() - 7100000).toISOString(),
  }),

  // Tests pipelines
  createMockPipelineRun({
    name: "tests-integration-abc123",
    pipelineType: pipelineType.tests,
    status: "failed",
    codebase: "my-app",
    branch: "main",
    pipelineName: "tests-pipeline",
    author: "test-runner",
    startTime: new Date(Date.now() - 4800000).toISOString(),
    completionTime: new Date(Date.now() - 4700000).toISOString(),
  }),
];

// Content wrapper component for FilterProvider
const PipelineRunListContentWrapper = ({
  children,
  args,
}: {
  children: React.ReactNode;
  args: Record<string, unknown>;
}) => {
  // Safely spread defaultFilterValues if it's an object
  const customFilterValues =
    args.defaultFilterValues && typeof args.defaultFilterValues === "object"
      ? (args.defaultFilterValues as Partial<PipelineRunListFilterValues>)
      : {};

  return (
    <FilterProvider<PipelineRun, PipelineRunListFilterValues>
      matchFunctions={matchFunctions}
      defaultValues={{
        [pipelineRunFilterControlNames.CODEBASES]: [],
        [pipelineRunFilterControlNames.NAMESPACES]: [],
        [pipelineRunFilterControlNames.STATUS]: "all",
        [pipelineRunFilterControlNames.PIPELINE_TYPE]: "all",
        ...customFilterValues,
      }}
    >
      {children}
    </FilterProvider>
  );
};

// Create decorator with PipelineRun-specific configuration
const pipelineRunListDecorator = withAppProviders({
  contentWrapper: PipelineRunListContentWrapper,
  seedQueryCache: (client) => {
    // Pre-seed permissions for PipelineRun
    const permissionsCacheKey = getK8sItemPermissionsQueryCacheKey(
      STORYBOOK_CLUSTER_NAME,
      STORYBOOK_NAMESPACE,
      k8sPipelineRunConfig.pluralName
    );
    client.setQueryData(permissionsCacheKey, mockPermissions);
  },
});

// Extended args for stories that include defaultFilterValues for the decorator
type PipelineRunListStoryArgs = React.ComponentProps<typeof PipelineRunList> & {
  defaultFilterValues?: Partial<PipelineRunListFilterValues>;
};

const meta: Meta<PipelineRunListStoryArgs> = {
  title: "Feature/PipelineRunList",
  component: PipelineRunList,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [pipelineRunListDecorator],
};

export default meta;
type Story = StoryObj<PipelineRunListStoryArgs>;

// =============================================================================
// COMPONENT VARIATIONS - Different states and configurations of the component
// =============================================================================

/**
 * Default state with all pipeline runs and all filter controls enabled.
 * Shows the full capability of the component.
 */
export const Default: Story = {
  args: {
    tableId: "storybook-pipeline-run-list",
    tableName: "Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns(),
    isLoading: false,
    pipelineRunTypes: [
      pipelineType.review,
      pipelineType.build,
      pipelineType.deploy,
      pipelineType.clean,
      pipelineType.security,
      pipelineType.release,
      pipelineType.tests,
    ],
    filterControls: [
      pipelineRunFilterControlNames.CODEBASES,
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.PIPELINE_TYPE,
      pipelineRunFilterControlNames.NAMESPACES,
    ],
  },
};

/**
 * Loading state - shows skeleton/loading indicators
 */
export const Loading: Story = {
  args: {
    tableId: "storybook-pipeline-run-list-loading",
    tableName: "Pipeline Runs",
    pipelineRuns: [],
    isLoading: true,
    filterControls: [
      pipelineRunFilterControlNames.CODEBASES,
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.PIPELINE_TYPE,
    ],
  },
};

/**
 * Empty state - no pipeline runs available
 */
export const Empty: Story = {
  args: {
    tableId: "storybook-pipeline-run-list-empty",
    tableName: "Pipeline Runs",
    pipelineRuns: [],
    isLoading: false,
    filterControls: [
      pipelineRunFilterControlNames.CODEBASES,
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.PIPELINE_TYPE,
    ],
  },
};

/**
 * Filtered by status: Success - shows only successful runs with status filter preselected
 */
export const FilteredByStatusSuccess: Story = {
  args: {
    tableId: "storybook-successful-runs",
    tableName: "Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns(),
    isLoading: false,
    filterControls: [
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.PIPELINE_TYPE,
      pipelineRunFilterControlNames.CODEBASES,
    ],
    defaultFilterValues: {
      [pipelineRunFilterControlNames.STATUS]: "true", // "true" = success in PipelineRunStatus
    },
  },
};

/**
 * Filtered by status: Failed - shows only failed runs with status filter preselected
 */
export const FilteredByStatusFailed: Story = {
  args: {
    tableId: "storybook-failed-runs",
    tableName: "Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns(),
    isLoading: false,
    filterControls: [
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.PIPELINE_TYPE,
      pipelineRunFilterControlNames.CODEBASES,
    ],
    defaultFilterValues: {
      [pipelineRunFilterControlNames.STATUS]: "false", // "false" = failed in PipelineRunStatus
    },
  },
};

/**
 * Filtered by pipeline type: Build - shows only build pipelines with type filter preselected
 */
export const FilteredByTypeBuild: Story = {
  args: {
    tableId: "storybook-build-runs",
    tableName: "Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns(),
    isLoading: false,
    pipelineRunTypes: [
      pipelineType.review,
      pipelineType.build,
      pipelineType.deploy,
      pipelineType.clean,
      pipelineType.security,
      pipelineType.release,
      pipelineType.tests,
    ],
    filterControls: [
      pipelineRunFilterControlNames.PIPELINE_TYPE,
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.CODEBASES,
    ],
    defaultFilterValues: {
      [pipelineRunFilterControlNames.PIPELINE_TYPE]: pipelineType.build,
    },
  },
};

/**
 * Multi-namespace scenario - shows runs from multiple namespaces with namespace filter
 */
export const WithNamespaceFilter: Story = {
  args: {
    tableId: "storybook-multi-namespace",
    tableName: "Pipeline Runs",
    pipelineRuns: [
      createMockPipelineRun({
        name: "build-dev-abc123",
        pipelineType: pipelineType.build,
        status: "succeeded",
        codebase: "my-app",
        namespace: "development",
        pipelineName: "build-pipeline",
      }),
      createMockPipelineRun({
        name: "build-staging-def456",
        pipelineType: pipelineType.build,
        status: "running",
        codebase: "my-app",
        namespace: "staging",
        pipelineName: "build-pipeline",
      }),
      createMockPipelineRun({
        name: "deploy-prod-ghi789",
        pipelineType: pipelineType.deploy,
        status: "succeeded",
        codebase: "my-app",
        namespace: "production",
        pipelineName: "deploy-pipeline",
        vcsTag: "1.0.0",
      }),
      createMockPipelineRun({
        name: "review-dev-jkl012",
        pipelineType: pipelineType.review,
        status: "failed",
        codebase: "another-service",
        namespace: "development",
        pipelineName: "review-pipeline",
      }),
    ],
    isLoading: false,
    filterControls: [
      pipelineRunFilterControlNames.NAMESPACES,
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.PIPELINE_TYPE,
      pipelineRunFilterControlNames.CODEBASES,
    ],
    defaultFilterValues: {
      [pipelineRunFilterControlNames.NAMESPACES]: ["development"],
    },
  },
};

/**
 * No filters - component without any filter controls
 */
export const WithoutFilters: Story = {
  args: {
    tableId: "storybook-no-filters",
    tableName: "Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns(),
    isLoading: false,
    filterControls: [],
  },
};

/**
 * Large dataset for performance testing - 100 pipeline runs
 */
export const LargeDataset: Story = {
  args: {
    tableId: "storybook-large-dataset",
    tableName: "Pipeline Runs (100 items)",
    pipelineRuns: Array.from({ length: 100 }, (_, i) =>
      createMockPipelineRun({
        name: `pipeline-run-${i.toString().padStart(3, "0")}`,
        pipelineType: [pipelineType.build, pipelineType.review, pipelineType.deploy, pipelineType.tests][i % 4],
        status: (["succeeded", "failed", "running", "unknown"] as const)[i % 4],
        codebase: `service-${(i % 5) + 1}`,
        branch: i % 3 === 0 ? "main" : i % 3 === 1 ? "develop" : `feature/feature-${i}`,
        pipelineName: `pipeline-${(i % 5) + 1}`,
        author: `developer-${(i % 10) + 1}`,
        startTime: new Date(Date.now() - i * 600000).toISOString(),
        completionTime: i % 4 !== 2 ? new Date(Date.now() - i * 600000 + 300000).toISOString() : undefined,
      })
    ),
    isLoading: false,
    filterControls: [
      pipelineRunFilterControlNames.CODEBASES,
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.PIPELINE_TYPE,
    ],
  },
};

// =============================================================================
// USAGE CONTEXTS - How the component is used in different parts of the app
// =============================================================================

/**
 * Pipeline Details Page Context
 * Shows pipeline runs for a specific pipeline without filters.
 * Used in: /tekton/pipelines/:name
 */
export const UsageContextPipelineDetails: Story = {
  args: {
    tableId: "storybook-pipeline-details-runs",
    tableName: "Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns().filter((pr) => pr.spec.pipelineRef?.name === "build-pipeline"),
    isLoading: false,
    filterControls: [],
  },
};

/**
 * Stage Pipeline Runs Context
 * Shows deploy/clean pipelines for a CD stage with limited filters.
 * Used in: /cdpipelines/:cdPipeline/stages/:stage
 */
export const UsageContextStagePipelineRuns: Story = {
  args: {
    tableId: "storybook-stage-pipeline-runs",
    tableName: "Stage Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns().filter(
      (pr) =>
        pr.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.deploy ||
        pr.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.clean
    ),
    isLoading: false,
    pipelineRunTypes: [pipelineType.deploy, pipelineType.clean],
    filterControls: [pipelineRunFilterControlNames.PIPELINE_TYPE, pipelineRunFilterControlNames.STATUS],
  },
};

/**
 * Branch Details Context
 * Shows review/build pipelines for a codebase branch with limited filters.
 * Used in: /codebases/:name (branch details section)
 */
export const UsageContextBranchDetails: Story = {
  args: {
    tableId: "storybook-branch-pipeline-runs",
    tableName: "Branch Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns().filter(
      (pr) =>
        pr.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.review ||
        pr.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.build
    ),
    isLoading: false,
    pipelineRunTypes: [pipelineType.review, pipelineType.build],
    filterControls: [pipelineRunFilterControlNames.PIPELINE_TYPE, pipelineRunFilterControlNames.STATUS],
  },
};

/**
 * General Pipeline Runs List Context
 * Full-featured list with all filters, used in the main pipeline runs page.
 * Used in: /tekton/pipelineruns
 */
export const UsageContextGeneralList: Story = {
  args: {
    tableId: "storybook-general-pipeline-runs",
    tableName: "Pipeline Runs",
    pipelineRuns: generateMockPipelineRuns(),
    isLoading: false,
    pipelineRunTypes: [
      pipelineType.review,
      pipelineType.build,
      pipelineType.deploy,
      pipelineType.clean,
      pipelineType.security,
      pipelineType.release,
      pipelineType.tests,
    ],
    filterControls: [
      pipelineRunFilterControlNames.CODEBASES,
      pipelineRunFilterControlNames.STATUS,
      pipelineRunFilterControlNames.PIPELINE_TYPE,
      pipelineRunFilterControlNames.NAMESPACES,
    ],
  },
};
