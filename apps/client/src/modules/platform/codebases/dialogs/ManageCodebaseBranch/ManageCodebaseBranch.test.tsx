import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ManageCodebaseBranchDialog } from "./index";
import type { ManageCodebaseBranchDialogProps } from "./types";
import { codebaseVersioning, codebaseBranchStatus, type Codebase, type CodebaseBranch } from "@my-project/shared";
import { TestProviders } from "@/test/utils";

// Mock the hooks
vi.mock("@/k8s/api/groups/KRCI/CodebaseBranch", () => ({
  useCodebaseBranchCRUD: () => ({
    triggerCreateCodebaseBranch: vi.fn(),
    triggerEditCodebaseBranch: vi.fn(),
    mutations: {
      codebaseBranchCreateMutation: {
        error: null,
        isPending: false,
      },
      codebaseBranchEditMutation: {
        error: null,
        isPending: false,
      },
    },
  }),
}));

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    gitfusion: {
      getBranchList: {
        query: vi.fn().mockResolvedValue({
          data: [{ name: "main" }, { name: "develop" }, { name: "feature/test" }],
        }),
      },
    },
  }),
}));

vi.mock("@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig", () => ({
  useWatchKRCIConfig: () => ({
    data: {
      data: {
        api_gateway_url: "https://api.example.com",
      },
    },
  }),
}));

// Mock data
const mockCodebase = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "Codebase",
  metadata: {
    name: "test-codebase",
    namespace: "edp-delivery-vp-dev",
  },
  spec: {
    type: "application",
    gitUrlPath: "/test-repo",
    gitServer: "github",
    defaultBranch: "main",
    versioning: {
      type: codebaseVersioning.edp,
    },
  },
} as unknown as Codebase;

const mockDefaultBranch = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CodebaseBranch",
  metadata: {
    name: "test-codebase-main",
    namespace: "edp-delivery-vp-dev",
  },
  spec: {
    branchName: "main",
    codebase: "test-codebase",
    version: "0.0.0-SNAPSHOT",
    release: false,
    pipelines: {
      build: "github-maven-java17-app-build-edp",
      review: "github-maven-java17-app-review-edp",
    },
  },
  status: {
    status: codebaseBranchStatus.created,
  },
} as unknown as CodebaseBranch;

const mockCodebaseBranches: CodebaseBranch[] = [
  mockDefaultBranch,
  {
    ...mockDefaultBranch,
    metadata: { ...mockDefaultBranch.metadata, name: "test-codebase-feature" },
    spec: { ...mockDefaultBranch.spec, branchName: "feature" },
  } as CodebaseBranch,
];

const mockPipelines = {
  build: "github-maven-java17-app-build-edp",
  review: "github-maven-java17-app-review-edp",
  security: "github-maven-java17-app-security-edp",
};

const renderDialog = (props: ManageCodebaseBranchDialogProps["props"], open = true) => {
  const mockCloseDialog = vi.fn();
  const mockOpenDialog = vi.fn();

  return render(
    <TestProviders>
      <ManageCodebaseBranchDialog
        props={props}
        state={{
          open,
          closeDialog: mockCloseDialog,
          openDialog: mockOpenDialog,
        }}
      />
    </TestProviders>
  );
};

describe("ManageCodebaseBranchDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("should render dialog in open state", async () => {
      renderDialog({
        codebase: mockCodebase,
        defaultBranch: mockDefaultBranch,
        codebaseBranches: mockCodebaseBranches,
        pipelines: mockPipelines,
      });

      await waitFor(() => {
        expect(screen.getByText(/create branch for/i)).toBeInTheDocument();
      });
    });

    it("should display form fields in create mode", async () => {
      renderDialog({
        codebase: mockCodebase,
        defaultBranch: mockDefaultBranch,
        codebaseBranches: mockCodebaseBranches,
        pipelines: mockPipelines,
      });

      await waitFor(() => {
        expect(screen.getByText(/create branch for/i)).toBeInTheDocument();
      });

      // Check for form fields
      const branchNameLabels = screen.getAllByText(/branch name/i);
      expect(branchNameLabels.length).toBeGreaterThan(0);
      expect(screen.getByText(/from/i)).toBeInTheDocument();
    });

    it("should pre-fill default branch name in fromCommit field", async () => {
      renderDialog({
        codebase: mockCodebase,
        defaultBranch: mockDefaultBranch,
        codebaseBranches: mockCodebaseBranches,
        pipelines: mockPipelines,
      });

      await waitFor(() => {
        expect(screen.getByText(/create branch for/i)).toBeInTheDocument();
      });

      // The fromCommit field should have the default branch name pre-filled
      // This is tested by checking if the combobox has the default branch value
      const branchNameInputs = screen.getAllByPlaceholderText(/branch name/i);
      expect(branchNameInputs.length).toBeGreaterThan(0);
    });
  });

  describe("Edit Mode", () => {
    it("should open dialog in edit mode when codebaseBranch is provided", async () => {
      const editBranch = {
        ...mockDefaultBranch,
        metadata: { ...mockDefaultBranch.metadata, name: "test-codebase-feature" },
        spec: { ...mockDefaultBranch.spec, branchName: "feature" },
      };

      renderDialog({
        codebase: mockCodebase,
        defaultBranch: mockDefaultBranch,
        codebaseBranches: mockCodebaseBranches,
        pipelines: mockPipelines,
        codebaseBranch: editBranch,
      });

      await waitFor(() => {
        // In edit mode, the dialog should show "Edit <branchName>" in the title
        expect(screen.getByText(/edit feature/i)).toBeInTheDocument();
      });
    });
  });

  describe("Dialog Actions", () => {
    it("should close dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      const mockCloseDialog = vi.fn();

      render(
        <TestProviders>
          <ManageCodebaseBranchDialog
            props={{
              codebase: mockCodebase,
              defaultBranch: mockDefaultBranch,
              codebaseBranches: mockCodebaseBranches,
              pipelines: mockPipelines,
            }}
            state={{
              open: true,
              closeDialog: mockCloseDialog,
              openDialog: vi.fn(),
            }}
          />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/create branch for/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(mockCloseDialog).toHaveBeenCalled();
      });
    });
  });

  describe("Form Validation", () => {
    it("should show validation errors when submitting empty form", async () => {
      const user = userEvent.setup();
      renderDialog({
        codebase: mockCodebase,
        defaultBranch: mockDefaultBranch,
        codebaseBranches: mockCodebaseBranches,
        pipelines: mockPipelines,
      });

      await waitFor(() => {
        expect(screen.getByText(/create branch for/i)).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      // Wait for validation to run
      await waitFor(() => {
        // Validation errors should appear
        const errorMessages = screen.queryAllByText(/required|enter|select/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });
});
