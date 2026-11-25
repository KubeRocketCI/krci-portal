import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import { createTestRouter } from "@/test/utils/router";
import { useScrollToHashTarget } from "./useScrollToHashTarget";

const TARGET = "worker-pool/krci-agents/workers";
const OTHER = "worker-pool/krci-agents/spare";

let setRowIds: (ids: string[]) => void = () => {};
let rerender: () => void = () => {};

/** Resolves once the router is idle: the router's own fragment scroll has run. */
async function renderAt(url: string, { rowIds = [TARGET, OTHER] } = {}) {
  function Rows() {
    const [ids, setIds] = React.useState(rowIds);
    const [, setTick] = React.useState(0);
    setRowIds = setIds;
    rerender = () => setTick((tick) => tick + 1);
    const target = useScrollToHashTarget(ids);
    return (
      <>
        <output aria-label="target">{target ?? "none"}</output>
        {ids.map((id) => (
          <div key={id} id={id}>
            {id}
          </div>
        ))}
      </>
    );
  }
  const router = createTestRouter(Rows, url);
  render(<RouterProvider router={router} />);
  await waitFor(() => expect(router.state.status).toBe("idle"));
}

/** The router also scrolls to the fragment when the element is there on navigation. */
describe("useScrollToHashTarget", () => {
  let scrollIntoView: MockInstance<Element["scrollIntoView"]>;

  beforeEach(() => {
    // The setup file's `scrollIntoView` mock keeps its calls across spyOn and restore.
    scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView").mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gives the URL fragment and scrolls only the element with that id into view", async () => {
    await renderAt(`/c/in-cluster/factory/worker-pools#${TARGET}`);

    expect(screen.getByRole("status", { name: "target" })).toHaveTextContent(TARGET);
    expect(new Set(scrollIntoView.mock.contexts)).toEqual(new Set([document.getElementById(TARGET)]));
  });

  it("does not scroll again on a render with the same rows or when the rows change", async () => {
    await renderAt(`/#${TARGET}`);
    scrollIntoView.mockClear();

    act(() => rerender());
    act(() => setRowIds([OTHER]));
    act(() => setRowIds([TARGET, OTHER]));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls when the rows change and the target renders after the first render", async () => {
    await renderAt(`/#${TARGET}`, { rowIds: [OTHER] });
    expect(scrollIntoView).not.toHaveBeenCalled();

    act(() => setRowIds([TARGET, OTHER]));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById(TARGET));
  });

  it("gives null and scrolls nothing with no fragment", async () => {
    await renderAt("/c/in-cluster/factory/worker-pools");

    expect(screen.getByRole("status", { name: "target" })).toHaveTextContent("none");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
