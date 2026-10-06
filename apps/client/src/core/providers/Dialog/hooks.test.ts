import React from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogContextProvider } from "./provider";
import { useDialogContext, useDialogOpener } from "./hooks";
import { DialogProps, DialogState } from "./types";

type Props = { name: string };

let lastState: DialogState | null = null;

/** Renders nothing; records the state the provider hands a dialog. */
function ProbeDialog({ state }: DialogProps<Props>) {
  lastState = state;
  return null;
}

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(DialogContextProvider, null, children);

describe("useDialogOpener", () => {
  it("returns the same function across re-renders", () => {
    const { result, rerender } = renderHook(() => useDialogOpener(ProbeDialog), { wrapper });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it("keeps its identity after a dialog opens and closes", () => {
    const { result } = renderHook(() => ({ open: useDialogOpener(ProbeDialog), context: useDialogContext() }), {
      wrapper,
    });
    const open = result.current.open;

    act(() => open({ name: "a" }));
    expect(result.current.open).toBe(open);
    expect(Object.keys(result.current.context.dialogs)).toEqual(["ProbeDialog"]);

    act(() => result.current.context.closeDialog("ProbeDialog"));
    expect(result.current.open).toBe(open);
    expect(result.current.context.dialogs).toEqual({});
  });
});

describe("DialogContextProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws in development when the component has no displayName or name", () => {
    const { result } = renderHook(() => useDialogContext(), { wrapper });

    expect(() => act(() => result.current.setDialog(() => null, {}))).toThrow(/displayName/);
  });

  it("does not throw outside development for a component without a key", () => {
    vi.stubEnv("DEV", false);
    const { result } = renderHook(() => useDialogContext(), { wrapper });

    expect(() => act(() => result.current.setDialog(() => null, {}))).not.toThrow();
  });

  it("keeps setDialog and closeDialog identities across dialog state changes", () => {
    const { result } = renderHook(() => useDialogContext(), { wrapper });
    const { setDialog, closeDialog } = result.current;

    act(() => setDialog(ProbeDialog, { name: "a" }));
    act(() => closeDialog("ProbeDialog"));

    expect(result.current.setDialog).toBe(setDialog);
    expect(result.current.closeDialog).toBe(closeDialog);
  });

  it("lets a dialog reopen itself through the state it was given", () => {
    lastState = null;
    const { result } = renderHook(() => useDialogContext(), { wrapper });

    act(() => result.current.setDialog(ProbeDialog, { name: "a" }));
    const state = lastState as DialogState | null;
    expect(state).not.toBeNull();

    act(() => state!.closeDialog());
    expect(result.current.dialogs).toEqual({});

    act(() => state!.openDialog());
    expect(Object.keys(result.current.dialogs)).toEqual(["ProbeDialog"]);
  });
});
