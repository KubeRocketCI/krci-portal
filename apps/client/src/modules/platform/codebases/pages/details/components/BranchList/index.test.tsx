import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Codebase, CodebaseBranch } from "@my-project/shared";
import { BranchList } from "./index";
import type { EnrichedBranch } from "./types";
import { stubResizeObserver } from "@/test/utils/resize-observer";

/**
 * Table state through the real DataTable: skeleton while the branch watch loads, the empty
 * state only once it is ready with no rows, rows once ready, the error content on failure.
 */

const setDialog = vi.fn();
const watchMocks = vi.hoisted(() => ({
  branches: [] as CodebaseBranch[],
  isLoading: false,
  error: null as Error | null,
}));

vi.mock("@/core/hooks/usePagination", () => ({
  usePagination: vi.fn(() => ({
    page: 0,
    rowsPerPage: 5,
    handleChangePage: vi.fn(),
    handleChangeRowsPerPage: vi.fn(),
  })),
}));

vi.mock("@/modules/platform/codebases/components/CreateCodebaseBranchDialog", () => ({
  CreateCodebaseBranchDialog: () => null,
}));

vi.mock("@/core/providers/Dialog/hooks", () => ({
  useDialogContext: () => ({ setDialog }),
}));

vi.mock("./components/BranchListActions", () => ({
  BranchListActions: () => <div>actions</div>,
}));

vi.mock("./hooks/useColumns", () => ({
  useColumns: () => [
    {
      id: "branch",
      label: "Branch",
      data: { render: ({ data }: { data: EnrichedBranch }) => data.codebaseBranch.spec.branchName },
      cell: { baseWidth: 100 },
    },
  ],
}));

vi.mock("../../hooks/data", () => ({
  useCodebaseWatch: () => ({
    query: { data: { metadata: { name: "app" }, spec: { defaultBranch: "main" } } as Codebase },
  }),
  useCodebaseBranchListWatch: () => ({
    data: { array: watchMocks.branches },
    isLoading: watchMocks.isLoading,
    isReady: !watchMocks.isLoading && !watchMocks.error,
    error: watchMocks.error,
  }),
  useCodebasePipelineRunListWatch: () => ({ data: { array: [] } }),
  usePipelineNamesWatch: () => ({ data: undefined }),
}));

const branch = (branchName: string): CodebaseBranch =>
  ({
    metadata: { name: `app-${branchName}`, labels: {} },
    spec: { branchName, codebaseName: "app" },
    status: {},
  }) as CodebaseBranch;

const EMPTY_TEXT = "There are no branches here.";
const skeletons = () => document.querySelectorAll('[data-slot="skeleton"]');

describe("BranchList", () => {
  beforeEach(() => {
    stubResizeObserver();
    setDialog.mockReset();
    watchMocks.branches = [];
    watchMocks.isLoading = false;
    watchMocks.error = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a skeleton and no empty state while the branch watch loads", () => {
    watchMocks.isLoading = true;

    render(<BranchList />);

    expect(skeletons().length).toBeGreaterThan(0);
    expect(screen.queryByText(EMPTY_TEXT)).not.toBeInTheDocument();
  });

  it("shows the empty state once ready with no branches and opens the create dialog from it", async () => {
    render(<BranchList />);

    expect(skeletons().length).toBe(0);
    expect(screen.getByText(EMPTY_TEXT)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Click here to add a new one" }));

    expect(setDialog).toHaveBeenCalledTimes(1);
  });

  it("renders the branches once ready", () => {
    watchMocks.branches = [branch("feature"), branch("main")];

    render(<BranchList />);

    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("feature")).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_TEXT)).not.toBeInTheDocument();
    expect(skeletons().length).toBe(0);
  });

  it("shows the error instead of the empty state when the watch fails", () => {
    watchMocks.error = new Error("boom");

    render(<BranchList />);

    expect(screen.getByText("Oops! Something went wrong. Please try again later.")).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_TEXT)).not.toBeInTheDocument();
    expect(skeletons().length).toBe(0);
  });
});
