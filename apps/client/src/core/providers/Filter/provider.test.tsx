import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useStore } from "@tanstack/react-form";
import { FilterProvider } from "./provider";
import { useFilterContext } from "./hooks";
import {
  defaultPipelineRunFilterValues,
  matchFunctions,
  normalizePipelineRunFilterUrlValues,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { PipelineRun } from "@my-project/shared";
import { PipelineRunListFilterValues } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/types";

const navigateMock = vi.hoisted(() => vi.fn((): Promise<void> => Promise.resolve()));
const searchState = vi.hoisted(() => ({ current: { status: "true" } as Record<string, unknown> }));

// Uses the PipelineRun normalizeUrlValues map as a realistic caller of the prop.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useSearch: () => searchState.current,
    useNavigate: () => navigateMock,
  };
});

function StatusProbe() {
  const { form } = useFilterContext<PipelineRun, PipelineRunListFilterValues>();
  const status = useStore(form.store, (state) => state.values.status);
  return <div data-testid="status">{status}</div>;
}

describe("FilterProvider normalizeUrlValues", () => {
  it("translates a legacy URL value before it becomes the form's initial value", () => {
    render(
      <FilterProvider<PipelineRun, PipelineRunListFilterValues>
        matchFunctions={matchFunctions}
        defaultValues={defaultPipelineRunFilterValues}
        syncWithUrl
        normalizeUrlValues={normalizePipelineRunFilterUrlValues}
      >
        <StatusProbe />
      </FilterProvider>
    );

    expect(screen.getByTestId("status").textContent).toBe("succeeded");
  });

  it("leaves the URL value untouched when normalizeUrlValues is not provided", () => {
    render(
      <FilterProvider<PipelineRun, PipelineRunListFilterValues>
        matchFunctions={matchFunctions}
        defaultValues={defaultPipelineRunFilterValues}
        syncWithUrl
      >
        <StatusProbe />
      </FilterProvider>
    );

    expect(screen.getByTestId("status").textContent).toBe("true");
  });
});

type FilterContext = ReturnType<typeof useFilterContext<PipelineRun, PipelineRunListFilterValues>>;

function ContextProbe({ onContext }: { onContext: (context: FilterContext) => void }) {
  const context = useFilterContext<PipelineRun, PipelineRunListFilterValues>();
  onContext(context);
  const values = useStore(context.form.store, (state) => state.values);
  return <div data-testid="values">{JSON.stringify(values)}</div>;
}

const runWithCodebase = (codebase: string) =>
  ({ metadata: { name: codebase, labels: { "app.edp.epam.com/codebase": codebase } } }) as unknown as PipelineRun;

const renderWithContext = () => {
  let context!: FilterContext;
  const ui = () => (
    <FilterProvider<PipelineRun, PipelineRunListFilterValues>
      matchFunctions={matchFunctions}
      defaultValues={defaultPipelineRunFilterValues}
      syncWithUrl
      normalizeUrlValues={normalizePipelineRunFilterUrlValues}
    >
      <ContextProbe onContext={(value) => (context = value)} />
    </FilterProvider>
  );
  const view = render(ui());
  const getContext = () => context;
  getContext.setUrl = (search: Record<string, unknown>) => {
    searchState.current = search;
    view.rerender(ui());
  };
  return getContext;
};

const lastSearch = (prev: Record<string, unknown>) => {
  const call = navigateMock.mock.calls.at(-1) as unknown as [
    { search: (prev: Record<string, unknown>) => unknown; replace: boolean },
  ];
  return { search: call[0].search(prev), replace: call[0].replace };
};

const readValues = () => JSON.parse(screen.getByTestId("values").textContent ?? "{}");

beforeEach(() => {
  searchState.current = { status: "true" };
  navigateMock.mockReset();
  navigateMock.mockImplementation(() => Promise.resolve());
});

describe("FilterProvider applyValues", () => {
  it("replaces every value, filling missing keys with defaults", () => {
    const getContext = renderWithContext();

    act(() => getContext().applyValues({ codebases: ["codemie"] }));

    expect(readValues()).toEqual({ ...defaultPipelineRunFilterValues, codebases: ["codemie"] });
  });

  it("runs normalizeUrlValues on the applied values", () => {
    const getContext = renderWithContext();

    act(() => getContext().applyValues({ status: "true" as never }));

    expect(readValues().status).toBe("succeeded");
  });

  it("updates filterFunction immediately", () => {
    const getContext = renderWithContext();

    act(() => getContext().applyValues({ codebases: ["codemie"] }));

    expect(getContext().filterFunction(runWithCodebase("codemie"))).toBe(true);
    expect(getContext().filterFunction(runWithCodebase("other"))).toBe(false);
  });

  it("writes non-default filters and extra params in one navigation, keeping unrelated params", () => {
    const getContext = renderWithContext();
    navigateMock.mockClear();

    act(() => getContext().applyValues({ codebases: ["codemie"] }, { search: { view: "v_1" }, replace: false }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(lastSearch({ tab: "x", status: "failed", search: "old" })).toEqual({
      search: { tab: "x", codebases: ["codemie"], view: "v_1" },
      replace: false,
    });
  });

  it("keeps reset() returning to the provider defaults after applyValues", () => {
    const getContext = renderWithContext();

    act(() => getContext().applyValues({ codebases: ["codemie"], pipelineType: "build" }));
    act(() => getContext().reset());

    expect(readValues()).toEqual(defaultPipelineRunFilterValues);
    expect(getContext().isDefaultValue).toBe(true);
  });
});

describe("FilterProvider reset", () => {
  it("clears only filter params from the URL", () => {
    const getContext = renderWithContext();
    navigateMock.mockClear();

    act(() => getContext().reset());

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(lastSearch({ view: "v_1", status: "failed", codebases: ["a"] })).toEqual({
      search: { view: "v_1" },
      replace: true,
    });
  });
});

describe("FilterProvider URL to form sync", () => {
  it("follows a URL change from browser navigation, also after the user edited a filter", async () => {
    const getContext = renderWithContext();

    act(() => getContext().form.setFieldValue("codebases", ["edited"]));
    await act(async () => {});
    act(() => getContext.setUrl({ pipelineType: "build" }));

    expect(readValues()).toEqual({ ...defaultPipelineRunFilterValues, pipelineType: "build" });
    expect(getContext().filterFunction(runWithCodebase("anything"))).toBe(false);
  });

  it("ignores a stale URL while its own write is in flight", () => {
    navigateMock.mockImplementation(() => new Promise<void>(() => {}));
    const getContext = renderWithContext();

    act(() => getContext().form.setFieldValue("search", "ab"));
    act(() => getContext.setUrl({ status: "true", search: "a" }));

    expect(readValues().search).toBe("ab");
  });

  it("navigates once per applyValues, also after the URL catches up", async () => {
    const getContext = renderWithContext();
    navigateMock.mockClear();

    act(() => getContext().applyValues({ codebases: ["codemie"] }, { search: { view: "v_1" } }));
    await act(async () => {});
    act(() => getContext.setUrl({ codebases: ["codemie"], view: "v_1" }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(readValues().codebases).toEqual(["codemie"]);
  });

  it("writes the first user change to the URL", () => {
    const getContext = renderWithContext();
    navigateMock.mockClear();

    act(() => getContext().form.setFieldValue("pipelineType", "build"));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(lastSearch({}).search).toEqual({ status: "succeeded", pipelineType: "build" });
  });
});
