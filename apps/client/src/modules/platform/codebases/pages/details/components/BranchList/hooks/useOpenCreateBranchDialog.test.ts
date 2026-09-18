import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Codebase, CodebaseBranch } from "@my-project/shared";
import { CreateCodebaseBranchDialog } from "@/modules/platform/codebases/components/CreateCodebaseBranchDialog";
import { useOpenCreateBranchDialog } from "./useOpenCreateBranchDialog";

const setDialog = vi.fn();
const dataMocks = vi.hoisted(() => ({
  codebase: undefined as Codebase | undefined,
  branches: [] as CodebaseBranch[],
  pipelineNames: undefined as
    | { reviewPipelineName: string; buildPipelineName: string; securityPipelineName: string }
    | undefined,
}));

vi.mock("@/modules/platform/codebases/components/CreateCodebaseBranchDialog", () => ({
  CreateCodebaseBranchDialog: () => null,
}));

vi.mock("@/core/providers/Dialog/hooks", () => ({
  useDialogContext: () => ({ setDialog }),
}));

vi.mock("../../../hooks/data", () => ({
  useCodebaseWatch: () => ({ query: { data: dataMocks.codebase } }),
  useCodebaseBranchListWatch: () => ({ data: { array: dataMocks.branches } }),
  usePipelineNamesWatch: () => ({ data: dataMocks.pipelineNames }),
}));

const branch = (branchName: string): CodebaseBranch =>
  ({ metadata: { name: `app-${branchName}` }, spec: { branchName, codebaseName: "app" } }) as CodebaseBranch;

const codebase = { metadata: { name: "app" }, spec: { defaultBranch: "main" } } as Codebase;

describe("useOpenCreateBranchDialog", () => {
  beforeEach(() => {
    setDialog.mockReset();
    dataMocks.codebase = codebase;
    dataMocks.branches = [branch("feature"), branch("main")];
    dataMocks.pipelineNames = {
      reviewPipelineName: "review",
      buildPipelineName: "build",
      securityPipelineName: "security",
    };
  });

  it("opens the dialog with the configured default branch and pipeline names", () => {
    const { result } = renderHook(() => useOpenCreateBranchDialog());

    result.current();

    expect(setDialog).toHaveBeenCalledWith(CreateCodebaseBranchDialog, {
      codebaseBranches: dataMocks.branches,
      codebase,
      defaultBranch: dataMocks.branches[1],
      pipelines: { review: "review", build: "build", security: "security" },
    });
  });

  it("falls back to the first branch when the configured default is absent", () => {
    dataMocks.branches = [branch("feature"), branch("develop")];
    const { result } = renderHook(() => useOpenCreateBranchDialog());

    result.current();

    expect(setDialog.mock.calls[0][1].defaultBranch).toBe(dataMocks.branches[0]);
  });

  it("sends empty pipeline names while they are unresolved", () => {
    dataMocks.pipelineNames = undefined;
    const { result } = renderHook(() => useOpenCreateBranchDialog());

    result.current();

    expect(setDialog.mock.calls[0][1].pipelines).toEqual({ review: "", build: "", security: "" });
  });

  it("does nothing until the codebase is loaded", () => {
    dataMocks.codebase = undefined;
    const { result } = renderHook(() => useOpenCreateBranchDialog());

    result.current();

    expect(setDialog).not.toHaveBeenCalled();
  });
});
