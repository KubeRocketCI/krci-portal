import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";

const mutateMock = vi.fn();
vi.mock("@/k8s/api/hooks/useResourceCRUDMutation", () => ({
  useResourceCRUDMutation: () => ({
    mutate: mutateMock,
    // The dialog now calls mutateAsync so it can await the request before navigating
    // — bare .mutate() resolves immediately and would navigate away on a failure.
    mutateAsync: mutateMock,
  }),
}));
vi.mock("@/core/router", () => ({ router: { navigate: vi.fn() } }));

import { DeleteKubeObjectDialog } from "./index";

const stubConfig = {
  apiVersion: "v1",
  kind: "Pod",
  group: "",
  version: "v1",
  singularName: "pod",
  pluralName: "pods",
} as const;

const stubResource = { metadata: { name: "x" } } as never;

function makeDialogProps(description: React.ReactNode, overrides?: { closeDialog?: () => void }) {
  return {
    props: {
      description,
      objectName: "my-pod",
      resourceConfig: stubConfig,
      resource: stubResource,
    },
    state: { open: true, closeDialog: overrides?.closeDialog ?? vi.fn(), openDialog: vi.fn() },
  };
}

describe("DeleteKubeObjectDialog description", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts ReactNode and renders nested elements", () => {
    render(
      <DeleteKubeObjectDialog
        {...makeDialogProps(
          <>
            <div>Delete CRD "my-crd".</div>
            <div>Removes all instances cluster-wide.</div>
          </>
        )}
      />
    );
    expect(screen.getByText(/Removes all instances cluster-wide/)).toBeInTheDocument();
  });

  it("still accepts plain string descriptions (backward compat)", () => {
    render(<DeleteKubeObjectDialog {...makeDialogProps("Delete this pod")} />);
    expect(screen.getByText("Delete this pod")).toBeInTheDocument();
  });
});

describe("DeleteKubeObjectDialog submit flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps Confirm disabled until the name input exactly matches the object name", async () => {
    const user = userEvent.setup();
    render(<DeleteKubeObjectDialog {...makeDialogProps("Delete this pod")} />);

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByLabelText(/Enter "my-pod" to delete/);
    await user.type(input, "wrong");
    expect(confirmBtn).toBeDisabled();

    await user.clear(input);
    await user.type(input, "my-pod");
    expect(confirmBtn).toBeEnabled();
  });

  it("invokes the delete mutation when the typed name matches and Confirm is clicked", async () => {
    const user = userEvent.setup();
    render(<DeleteKubeObjectDialog {...makeDialogProps("Delete this pod")} />);

    await user.type(screen.getByLabelText(/Enter "my-pod" to delete/), "my-pod");
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith({ resource: stubResource, resourceConfig: stubConfig });
  });
});
