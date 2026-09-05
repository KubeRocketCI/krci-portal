import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

// Uses the PipelineRun normalizeUrlValues map as a realistic caller of the prop.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useSearch: () => ({ status: "true" }),
    useNavigate: () => vi.fn(),
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
