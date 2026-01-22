import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { CreateCodebaseWizard } from "./index";
import { createTestQueryClient } from "@/test/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { TRPCContext } from "@/core/providers/trpc/context";
import { trpcHttpClient } from "@/core/providers/trpc/http-client";
import { useClusterStore } from "@/k8s/store";
import React from "react";

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

// Mock the route module for routeComponentList
vi.mock("../../../list/route", () => ({
  routeComponentList: {
    fullPath: "/c/$clusterName/components",
    to: "/c/$clusterName/components",
  },
}));

// Mock the hooks (use importOriginal so other exports like getGitServerStatusIcon are available)
vi.mock("@/k8s/api/groups/KRCI/GitServer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/k8s/api/groups/KRCI/GitServer")>();
  return {
    ...actual,
    useGitServerWatchList: () => ({
      data: {
        array: [
          {
            metadata: { name: "github" },
            status: { connected: true },
          },
        ],
      },
      query: { isLoading: false },
    }),
    useGitServerWatchItem: () => ({
      data: {
        metadata: { name: "github" },
        status: { connected: true },
      },
      query: { isLoading: false },
    }),
  };
});

vi.mock("@/k8s/api/groups/KRCI/Codebase", () => ({
  useCodebaseCRUD: () => ({
    triggerCreateCodebase: vi.fn(),
    mutations: {
      codebaseCreateMutation: {
        isPending: false,
        error: null,
      },
      codebaseSecretCreateMutation: {
        isPending: false,
        error: null,
      },
      codebaseSecretDeleteMutation: {
        isPending: false,
        error: null,
      },
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
      pathname: "/_layout/c/in-cluster/codebases/create",
    }),
    useRouter: () => ({
      navigate: vi.fn(),
      state: {
        location: {
          pathname: "/_layout/c/in-cluster/codebases/create",
        },
      },
    }),
    Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      return React.createElement("a", { ...props, href: "#" }, children);
    },
  };
});

describe("CreateCodebaseWizard", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
    // Set up cluster store
    useClusterStore.setState({
      clusterName: "in-cluster",
      defaultNamespace: "default",
      allowedNamespaces: ["default"],
    });
  });

  const renderWizard = () => {
    const queryClient = createTestQueryClient();
    return render(
      <TRPCContext.Provider value={trpcHttpClient}>
        <QueryClientProvider client={queryClient}>
          <CreateCodebaseWizard />
        </QueryClientProvider>
      </TRPCContext.Provider>
    );
  };

  it("should render the wizard", () => {
    renderWizard();
    expect(screen.getByText(/initial setup/i)).toBeInTheDocument();
  });

  it("should show stepper navigation", () => {
    renderWizard();
    expect(screen.getByText(/git & project info/i)).toBeInTheDocument();
    expect(screen.getByText(/build config/i)).toBeInTheDocument();
    expect(screen.getByText(/review and create/i)).toBeInTheDocument();
  });

  it("should show validation errors when clicking continue without filling fields", async () => {
    const user = userEvent.setup();
    renderWizard();

    const continueButton = screen.getByRole("button", { name: /continue/i });
    await user.click(continueButton);

    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/required|enter|select/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it("should navigate between steps", async () => {
    const user = userEvent.setup();
    renderWizard();

    // Step 1 (Initial Setup): select Custom Configuration → Application → Create, then Continue
    // Radios use value-based accessible names (radio-custom, etc.)
    await user.click(screen.getByRole("radio", { name: /radio-custom/i }));
    await user.click(screen.getByRole("radio", { name: /application/i }));
    await user.click(screen.getByRole("radio", { name: /radio-create/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 2 (Git & Project Info): fill Component Name and continue
    const nameInput = await screen.findByPlaceholderText(/enter component name/i);
    await user.type(nameInput, "test-codebase");
    expect(nameInput).toHaveValue("test-codebase");

    const continueButton = screen.getByRole("button", { name: /continue/i });
    await user.click(continueButton);
  });
});
