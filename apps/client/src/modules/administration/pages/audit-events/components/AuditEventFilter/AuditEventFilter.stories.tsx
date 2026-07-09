import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppProviders } from "@sb/index";
import { FilterProvider } from "@/core/providers/Filter";
import type { KrciAuditFacetsResponse } from "@my-project/shared";
import { AuditEventFilter } from "./index";
import { defaultAuditEventFilterValues, matchFunctions } from "./constants";

const AUDIT_FACETS_QUERY_KEY = ["krciAudit", "getAuditFacets", ["namespace", "kind", "actor"]];

function seedAuditFacets(response: KrciAuditFacetsResponse) {
  return (queryClient: import("@tanstack/react-query").QueryClient) => {
    queryClient.setQueryData(AUDIT_FACETS_QUERY_KEY, response);
  };
}

const lowCardinalityFacets: KrciAuditFacetsResponse = {
  namespace: { values: ["default", "krci", "krci-e2e"], truncated: false },
  kind: { values: ["PipelineRun", "Codebase", "CDPipeline"], truncated: false },
  actor: { values: ["kubernetes-admin", "system:serviceaccount:krci:krci-admin"], truncated: false },
};

const meta = {
  title: "Modules/Administration/AuditEventFilter",
  component: AuditEventFilter,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    withAppProviders({
      contentWrapper: ({ children }) => (
        <FilterProvider matchFunctions={matchFunctions} defaultValues={defaultAuditEventFilterValues}>
          <div className="grid grid-cols-12 gap-4">{children}</div>
        </FilterProvider>
      ),
      seedQueryCache: seedAuditFacets(lowCardinalityFacets),
    }),
  ],
} satisfies Meta<typeof AuditEventFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Low-cardinality facets (truncated: false) — namespace/kind/actor render as searchable
// single-select dropdowns sourced from the audit trail.
export const Default: Story = {};

// Shows the filter fields pre-populated with example values, covering the "filtered"
// visual state of this component per the repo's .tsx→Storybook convention (see
// AdminAuditEventsPage.stories.tsx for the corresponding table states).
export const Filtered: Story = {
  decorators: [
    withAppProviders({
      contentWrapper: ({ children }) => (
        <FilterProvider
          matchFunctions={matchFunctions}
          defaultValues={{
            ...defaultAuditEventFilterValues,
            kind: "PipelineRun",
            namespace: "krci",
            operation: "CREATE",
            actor: "kubernetes-admin",
          }}
        >
          <div className="grid grid-cols-12 gap-4">{children}</div>
        </FilterProvider>
      ),
      seedQueryCache: seedAuditFacets(lowCardinalityFacets),
    }),
  ],
};

// A truncated facet (> 50 distinct values) falls back to free text instead of a partial
// dropdown that would omit the caller's value.
export const TruncatedFacetsFallBackToFreeText: Story = {
  decorators: [
    withAppProviders({
      contentWrapper: ({ children }) => (
        <FilterProvider matchFunctions={matchFunctions} defaultValues={defaultAuditEventFilterValues}>
          <div className="grid grid-cols-12 gap-4">{children}</div>
        </FilterProvider>
      ),
      seedQueryCache: seedAuditFacets({
        namespace: { values: ["default", "krci"], truncated: false },
        kind: { values: [], truncated: true },
        actor: { values: [], truncated: true },
      }),
    }),
  ],
};
