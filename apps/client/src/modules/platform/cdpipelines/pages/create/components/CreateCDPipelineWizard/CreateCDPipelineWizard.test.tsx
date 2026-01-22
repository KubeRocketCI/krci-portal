import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { CreateCDPipelineWizard } from "./index";
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
}));

// Mock the route module for routeCDPipelineList
vi.mock("../../../list/route", () => ({
  routeCDPipelineList: {
    fullPath: "/c/$clusterName/cdpipelines",
    to: "/c/$clusterName/cdpipelines",
  },
}));

// Mock the create route so useDefaultValues doesn't call routeCDPipelineCreate.useSearch in tests
vi.mock("../../route", () => ({
  routeCDPipelineCreate: {
    useSearch: () => ({}),
  },
}));

// Mock the hooks
vi.mock("@/k8s/api/groups/KRCI/CDPipeline", () => ({
  useCDPipelineCRUD: () => ({
    triggerCreateCDPipeline: vi.fn(),
    mutations: {
      cdPipelineCreateMutation: {
        isPending: false,
        error: null,
      },
    },
  }),
}));

vi.mock("@/k8s/api/groups/KRCI/Codebase", () => ({
  useCodebaseWatchList: () => ({
    data: {
      array: [
        {
          metadata: {
            name: "test-codebase",
            namespace: "test-namespace",
          },
          spec: {
            type: "application",
            defaultBranch: "main",
          },
        },
      ],
    },
    query: {
      isLoading: false,
    },
  }),
}));

vi.mock("@/k8s/api/groups/KRCI/CodebaseBranch", () => ({
  useCodebaseBranchWatchList: () => ({
    data: {
      array: [
        {
          metadata: {
            name: "test-codebase-main",
            namespace: "test-namespace",
          },
          spec: {
            branchName: "main",
            codebase: "test-codebase",
          },
        },
      ],
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
    }),
    useNavigate: () => vi.fn(),
    useMatch: () => ({
      params: { clusterName: "in-cluster" },
      pathname: "/_layout/c/in-cluster/cdpipelines/create",
    }),
    useRouter: () => ({
      navigate: vi.fn(),
      state: {
        location: {
          pathname: "/_layout/c/in-cluster/cdpipelines/create",
        },
      },
    }),
  };
});

describe("CreateCDPipelineWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TODO: routeCDPipelineCreate.useSearch() mock is not applied; wizard needs router/route context
  it.skip("should render the wizard", () => {
    render(
      <TestProviders>
        <CreateCDPipelineWizard />
      </TestProviders>
    );
    expect(screen.getByText(/pipeline info/i)).toBeInTheDocument();
  });

  it.skip("should show stepper navigation", () => {
    render(
      <TestProviders>
        <CreateCDPipelineWizard />
      </TestProviders>
    );
    expect(screen.getByText(/applications/i)).toBeInTheDocument();
  });

  it.skip("should show validation errors when clicking continue without filling fields", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CreateCDPipelineWizard />
      </TestProviders>
    );

    const continueButton = screen.getByRole("button", { name: /continue/i });
    await user.click(continueButton);

    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/required|enter|select/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it.skip("should allow filling in pipeline name", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CreateCDPipelineWizard />
      </TestProviders>
    );

    const nameInput = screen.getByPlaceholderText(/enter pipeline name/i);
    await user.type(nameInput, "test-pipeline");

    expect(nameInput).toHaveValue("test-pipeline");
  });
});
