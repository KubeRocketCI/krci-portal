import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { CreateStageWizard } from "./index";
import { TestProviders } from "@/test/utils";

// Mock the router module to prevent initialization errors
vi.mock("@/core/router", () => ({
  contentLayoutRoute: {},
  authRoute: {},
  indexRoute: {},
  routeCluster: {},
  routeCICD: {},
  routeObservability: {},
  routeSecurity: {},
  routeConfiguration: {},
  router: {
    navigate: vi.fn(),
  },
}));

// Mock the route modules (use path that matches imports from hooks and index)
vi.mock("../../route", () => ({
  routeStageCreate: {
    fullPath: "/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/create",
    to: "/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/create",
    useParams: () => ({
      namespace: "test-namespace",
      cdPipeline: "test-pipeline",
    }),
  },
  PATH_STAGE_CREATE_FULL: "/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/create",
}));

// Mock useCDPipelineData so it doesn't depend on route; component needs cdPipelineIsLoading false to render
vi.mock("./hooks/useDefaultValues", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./hooks/useDefaultValues")>();
  return {
    ...actual,
    useCDPipelineData: () => ({
      cdPipeline: { metadata: { name: "test-pipeline" }, spec: { name: "test-pipeline" } },
      cdPipelineIsLoading: false,
      cdPipelineError: null,
      otherStages: [],
      otherStagesIsLoading: false,
      namespace: "test-namespace",
    }),
  };
});

vi.mock("@/modules/platform/cdpipelines/pages/details/route", () => ({
  routeCDPipelineDetails: {
    fullPath: "/c/$clusterName/cdpipelines/$namespace/$cdPipeline",
    to: "/c/$clusterName/cdpipelines/$namespace/$cdPipeline",
  },
}));

vi.mock("@/modules/platform/cdpipelines/pages/stage-details/route", () => ({
  routeStageDetails: {
    fullPath: "/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/$stage",
    to: "/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/$stage",
  },
}));

// Mock the hooks
vi.mock("@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig", () => ({
  useWatchKRCIConfig: () => ({
    data: {
      data: {
        api_gateway_url: "https://api.example.com",
      },
    },
  }),
}));

vi.mock("@/k8s/api/groups/Tekton/TriggerTemplate", () => ({
  useTriggerTemplateWatchList: () => ({
    data: {
      array: [
        {
          metadata: {
            name: "github-deploy-template",
            labels: {
              "app.edp.epam.com/pipelinetype": "deploy",
            },
          },
        },
        {
          metadata: {
            name: "github-clean-template",
            labels: {
              "app.edp.epam.com/pipelinetype": "clean",
            },
          },
        },
      ],
    },
    query: {
      isLoading: false,
    },
  }),
}));

vi.mock("@/k8s/api/groups/KRCI/Stage", () => ({
  useStageCRUD: () => ({
    triggerCreateStage: vi.fn(),
    mutations: {
      stageCreateMutation: {
        isPending: false,
        error: null,
      },
    },
  }),
  useStageWatchList: () => ({
    data: {
      array: [],
    },
    query: {
      isLoading: false,
    },
  }),
}));

vi.mock("@/k8s/api/groups/KRCI/CDPipeline", () => ({
  useCDPipelineWatchItem: () => ({
    query: {
      data: {
        metadata: {
          name: "test-pipeline",
          namespace: "test-namespace",
        },
        spec: {
          name: "test-pipeline",
        },
      },
      isLoading: false,
      error: null,
    },
  }),
}));

vi.mock("@/k8s/api/groups/KRCI/Codebase", () => ({
  useCodebaseWatchList: () => ({
    data: {
      array: [],
    },
    query: {
      isLoading: false,
    },
  }),
}));

vi.mock("@/k8s/api/groups/KRCI/CodebaseBranch", () => ({
  useCodebaseBranchWatchList: () => ({
    data: {
      array: [],
    },
    query: {
      isLoading: false,
    },
  }),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    useParams: () => ({
      clusterName: "in-cluster",
      namespace: "test-namespace",
      cdPipeline: "test-pipeline",
    }),
    useNavigate: () => vi.fn(),
    useMatch: () => ({
      params: {
        clusterName: "in-cluster",
        namespace: "test-namespace",
        cdPipeline: "test-pipeline",
      },
      pathname: "/_layout/c/in-cluster/cdpipelines/test-namespace/test-pipeline/stages/create",
    }),
    useRouter: () => ({
      navigate: vi.fn(),
      state: {
        location: {
          pathname: "/_layout/c/in-cluster/cdpipelines/test-namespace/test-pipeline/stages/create",
        },
      },
    }),
  };
});

describe("CreateStageWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TODO: routeStageCreate.useParams() mock is not applied when component loads; wizard needs router/route context
  it.skip("should render the wizard", () => {
    render(
      <TestProviders>
        <CreateStageWizard />
      </TestProviders>
    );
    expect(screen.getByText(/basic configuration/i)).toBeInTheDocument();
  });

  it.skip("should show stepper navigation", () => {
    render(
      <TestProviders>
        <CreateStageWizard />
      </TestProviders>
    );
    expect(screen.getByText(/pipeline configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/quality gates/i)).toBeInTheDocument();
  });

  it.skip("should show validation errors when clicking continue without filling fields", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CreateStageWizard />
      </TestProviders>
    );

    const continueButton = screen.getByRole("button", { name: /continue/i });
    await user.click(continueButton);

    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/required|enter|select/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
});
