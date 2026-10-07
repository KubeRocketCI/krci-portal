import React, { Suspense } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lazyPreloadable } from "./index";

type Props = { label: string };

function Probe({ label }: Props) {
  return <span>probe:{label}</span>;
}

/** Loader whose chunk settles only when the test calls `resolve` or `reject`; counts imports. */
function deferredLoader() {
  let calls = 0;
  let settle!: { resolve: () => void; reject: (error: Error) => void };
  const loader = () => {
    calls += 1;
    return new Promise<{ Probe: React.ComponentType<Props> }>((resolve, reject) => {
      settle = { resolve: () => resolve({ Probe }), reject };
    });
  };
  return {
    loader,
    calls: () => calls,
    resolve: () => settle.resolve(),
    reject: (error: Error) => settle.reject(error),
  };
}

class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? <span>error:{this.state.error.message}</span> : this.props.children;
  }
}

function renderLazy(Component: React.ComponentType<Props>) {
  return render(
    <Boundary>
      <Suspense fallback={<span role="status">loading</span>}>
        <Component label="a" />
      </Suspense>
    </Boundary>
  );
}

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

describe("lazyPreloadable", () => {
  beforeEach(() => {
    // React logs caught render errors.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("suspends until the chunk resolves, then renders the export with its props", async () => {
    const chunk = deferredLoader();
    const Component = lazyPreloadable(chunk.loader, "Probe");
    renderLazy(Component);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(chunk.calls()).toBe(1);

    await act(async () => chunk.resolve());

    expect(await screen.findByText("probe:a")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("preload imports the chunk once", async () => {
    const chunk = deferredLoader();
    const Component = lazyPreloadable(chunk.loader, "Probe");

    Component.preload();
    Component.preload();
    renderLazy(Component);

    expect(chunk.calls()).toBe(1);
  });

  it("renders without the fallback once preload resolved", async () => {
    const chunk = deferredLoader();
    const Component = lazyPreloadable(chunk.loader, "Probe");

    Component.preload();
    await act(async () => chunk.resolve());
    renderLazy(Component);

    expect(screen.getByText("probe:a")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(chunk.calls()).toBe(1);
  });

  it("imports again on the next preload after a rejected preload", async () => {
    const chunk = deferredLoader();
    const Component = lazyPreloadable(chunk.loader, "Probe");

    Component.preload();
    await act(async () => chunk.reject(new Error("offline")));
    Component.preload();

    expect(chunk.calls()).toBe(2);
  });

  it("imports again on the first render after a rejected preload", async () => {
    const chunk = deferredLoader();
    const Component = lazyPreloadable(chunk.loader, "Probe");

    Component.preload();
    await act(async () => chunk.reject(new Error("offline")));
    renderLazy(Component);
    await act(async () => chunk.resolve());

    expect(chunk.calls()).toBe(2);
    expect(await screen.findByText("probe:a")).toBeInTheDocument();
  });

  it("passes a rendered rejection to the error boundary without importing again", async () => {
    const chunk = deferredLoader();
    const Component = lazyPreloadable(chunk.loader, "Probe");
    renderLazy(Component);

    await act(async () => chunk.reject(new Error("offline")));
    await flush();

    expect(screen.getByText("error:offline")).toBeInTheDocument();
    expect(chunk.calls()).toBe(1);
  });

  it("renders on the next mount once a preload succeeded after a rendered rejection", async () => {
    const chunk = deferredLoader();
    const Component = lazyPreloadable(chunk.loader, "Probe");
    const first = renderLazy(Component);
    await act(async () => chunk.reject(new Error("offline")));
    await flush();
    first.unmount();

    Component.preload();
    await act(async () => chunk.resolve());
    renderLazy(Component);

    expect(screen.getByText("probe:a")).toBeInTheDocument();
    expect(chunk.calls()).toBe(2);
  });
});
