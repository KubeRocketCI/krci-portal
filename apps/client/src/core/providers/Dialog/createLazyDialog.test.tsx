import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createLazyDialog } from "./createLazyDialog";
import { useDialogContext, useDialogOpener } from "./hooks";
import { DialogContextProvider } from "./provider";
import { DialogProps } from "./types";

type Props = { label: string };

function ProbeDialog({ props, state }: DialogProps<Props>) {
  return (
    <div>
      <span>probe-open:{props.label}</span>
      <button onClick={state.closeDialog}>probe-close</button>
    </div>
  );
}

/** Lazy dialog whose chunk resolves only when the test calls `resolve`. */
function deferredLazyDialog(name: string) {
  let resolve!: () => void;
  const chunk = new Promise<{ ProbeDialog: React.ComponentType<DialogProps<Props>> }>((res) => {
    resolve = () => res({ ProbeDialog });
  });
  return { LazyDialog: createLazyDialog(name, () => chunk, "ProbeDialog"), resolve };
}

function Harness({ dialog }: { dialog: React.ComponentType<DialogProps<Props>> }) {
  const open = useDialogOpener(dialog);
  const { dialogs } = useDialogContext();
  return (
    <div>
      <button onClick={() => open({ label: "a" })}>open</button>
      <span data-testid="keys">{Object.keys(dialogs).join(",")}</span>
    </div>
  );
}

function renderHarness(dialog: React.ComponentType<DialogProps<Props>>) {
  return render(
    <DialogContextProvider>
      <Harness dialog={dialog} />
    </DialogContextProvider>
  );
}

describe("createLazyDialog", () => {
  it("is keyed by the given name before the chunk resolves", async () => {
    const { LazyDialog } = deferredLazyDialog("LazyProbe");
    renderHarness(LazyDialog);

    await userEvent.click(screen.getByText("open"));

    expect(screen.getByTestId("keys")).toHaveTextContent("LazyProbe");
  });

  it("shows the loading shell, then the dialog once the chunk resolves", async () => {
    const { LazyDialog, resolve } = deferredLazyDialog("LazyProbe");
    renderHarness(LazyDialog);

    await userEvent.click(screen.getByText("open"));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("probe-open:a")).not.toBeInTheDocument();

    await act(async () => resolve());

    expect(await screen.findByText("probe-open:a")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("passes props and state through to the resolved dialog", async () => {
    const { LazyDialog, resolve } = deferredLazyDialog("LazyProbe");
    renderHarness(LazyDialog);

    await userEvent.click(screen.getByText("open"));
    await act(async () => resolve());

    expect(await screen.findByText("probe-open:a")).toBeInTheDocument();
    await userEvent.click(screen.getByText("probe-close"));

    expect(screen.getByTestId("keys")).toHaveTextContent("");
    expect(screen.queryByText("probe-open:a")).not.toBeInTheDocument();
  });

  it("preload imports the chunk once, without opening", async () => {
    let calls = 0;
    const LazyDialog = createLazyDialog(
      "LazyProbe",
      () => {
        calls += 1;
        return Promise.resolve({ ProbeDialog });
      },
      "ProbeDialog"
    );
    renderHarness(LazyDialog);

    LazyDialog.preload();
    LazyDialog.preload();

    expect(calls).toBe(1);
    expect(screen.getByTestId("keys")).toHaveTextContent("");
  });

  it("opens without the loading shell once preload resolved", async () => {
    const { LazyDialog, resolve } = deferredLazyDialog("LazyProbe");
    renderHarness(LazyDialog);

    LazyDialog.preload();
    await act(async () => resolve());

    await userEvent.click(screen.getByText("open"));

    expect(screen.getByText("probe-open:a")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("retries the import on the next open after a rejected chunk", async () => {
    let calls = 0;
    const LazyDialog = createLazyDialog(
      "LazyProbe",
      () => {
        calls += 1;
        return calls === 1 ? Promise.reject(new Error("offline")) : Promise.resolve({ ProbeDialog });
      },
      "ProbeDialog"
    );

    LazyDialog.preload();
    await act(async () => {
      await Promise.resolve();
    });
    LazyDialog.preload();
    await act(async () => {
      await Promise.resolve();
    });

    expect(calls).toBe(2);
  });

  it("closing the loading shell removes the entry", async () => {
    const { LazyDialog } = deferredLazyDialog("LazyProbe");
    renderHarness(LazyDialog);

    await userEvent.click(screen.getByText("open"));
    expect(screen.getByRole("status")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.getByTestId("keys")).toHaveTextContent("");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
