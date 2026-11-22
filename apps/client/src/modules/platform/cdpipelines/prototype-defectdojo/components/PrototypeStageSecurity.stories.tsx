// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Fixtures: recorded from the testbed DefectDojo by `packages/trpc/scripts/prototype-defectdojo-record.ts`.
// One story renders both Stage page pieces under one provider, as the page does: the request log
// under them shows that the Overview summary and the Applications column share one fetch.
import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import { Alert } from "@/core/components/ui/alert";
import { Card } from "@/core/components/ui/card";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import defectDojoTestbed from "@/modules/platform/security/prototype-defectdojo/__fixtures__/defectdojo-testbed.json";
import pipelineScopes from "@/modules/platform/security/prototype-defectdojo/__fixtures__/pipeline-scopes.json";
import {
  createFixtureDefectDojoApi,
  type PrototypeDefectDojoFixtureMode,
} from "@/modules/platform/security/prototype-defectdojo/api/fixtureApi";
import { PrototypeDefectDojoProvider } from "@/modules/platform/security/prototype-defectdojo/api/provider";
import { PrototypeStatePanel } from "@/modules/platform/security/prototype-defectdojo/components/PrototypeStatePanel";
import { ApplicationSecurityCell } from "./ApplicationSecurityCell";
import { EnvironmentSecuritySummary } from "./EnvironmentSecuritySummary";

interface HarnessProps {
  /** `key` of a scope of `pipeline-scopes.json`. */
  scopeKey: string;
  /** Stage whose pieces the story renders. */
  stage: string;
  mode: PrototypeDefectDojoFixtureMode;
  /** Which Stage page pieces to render. */
  pieces: ("summary" | "applications")[];
}

function Harness({ scopeKey, stage, mode, pieces }: HarnessProps) {
  const api = React.useMemo(() => createFixtureDefectDojoApi(defectDojoTestbed, mode), [mode]);
  const recorded = pipelineScopes.find((candidate) => candidate.key === scopeKey);
  const environment = recorded?.environments.find((candidate) => candidate.stage === stage);

  // The Stage page scope holds the one Environment of the route.
  const pipeline = React.useMemo(
    () => (recorded && environment ? { ...recorded, environments: [environment] } : null),
    [recorded, environment]
  );

  if (!pipeline || !environment) {
    return (
      <p>
        No recorded scope {scopeKey} with stage {stage}.
      </p>
    );
  }

  return (
    <PrototypeDefectDojoProvider api={api} cacheScope={`stage-${pipeline.cdPipeline}-${stage}`}>
      <div className="space-y-4">
        {recorded?.note && <Alert>{recorded.note}</Alert>}

        {pieces.includes("summary") && (
          <section aria-label="Stage Overview tab: security summary">
            <EnvironmentSecuritySummary pipeline={pipeline} stage={stage} />
          </section>
        )}

        {pieces.includes("applications") && (
          <Card className="p-0" aria-label="Stage Applications tab: Security column">
            <TableUI aria-label="Applications">
              <TableHeaderUI>
                <TableRowUI>
                  <TableHeadUI scope="col" className="bg-muted px-3 py-2 text-xs font-medium">
                    Application
                  </TableHeadUI>
                  <TableHeadUI scope="col" className="bg-muted w-72 px-3 py-2 text-xs font-medium">
                    Security
                  </TableHeadUI>
                </TableRowUI>
              </TableHeaderUI>
              <TableBodyUI>
                {[...environment.applications.map((application) => application.codebaseName), "not-deployed-app"].map(
                  (codebaseName) => (
                    <TableRowUI key={codebaseName}>
                      <TableCellUI className="px-3 py-2 text-sm">{codebaseName}</TableCellUI>
                      <TableCellUI className="px-3 py-2">
                        <ApplicationSecurityCell pipeline={pipeline} stage={stage} codebaseName={codebaseName} />
                      </TableCellUI>
                    </TableRowUI>
                  )
                )}
              </TableBodyUI>
            </TableUI>
          </Card>
        )}

        <PrototypeStatePanel state={{ pipeline, stage }} />
      </div>
    </PrototypeDefectDojoProvider>
  );
}

const meta: Meta<typeof Harness> = {
  title: "Prototype/DefectDojo/Stage Page Security",
  component: Harness,
  decorators: [withAppProviders()],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Harness>;

export const OverviewSummaryData: Story = {
  args: { scopeKey: "demo", stage: "dev", mode: "recorded", pieces: ["summary"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/1 workload containers scanned/)).toBeVisible();
    await expect(canvas.getByText(/0 without a codebase/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Findings of this namespace" })).toBeVisible();
  },
};

export const OverviewSummaryDense: Story = {
  args: { scopeKey: "dense", stage: "krci", mode: "recorded", pieces: ["summary"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/8 workload containers scanned/)).toBeVisible();
    await expect(canvas.getByText(/8 without a codebase/)).toBeVisible();
  },
};

export const OverviewSummaryNoScanData: Story = {
  args: { scopeKey: "no-data", stage: "qa", mode: "recorded", pieces: ["summary"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("No scan data")).toBeVisible();
    await expect(canvas.queryByText("Clean")).not.toBeInTheDocument();
  },
};

export const OverviewSummaryNotConfigured: Story = {
  args: { scopeKey: "demo", stage: "dev", mode: "notConfigured", pieces: ["summary"] },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/DefectDojo is not connected/)).toBeVisible();
  },
};

export const OverviewSummaryUnreachable: Story = {
  args: { scopeKey: "demo", stage: "dev", mode: "unreachable", pieces: ["summary"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("DefectDojo is unreachable")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeVisible();
  },
};

export const ApplicationsColumnData: Story = {
  args: { scopeKey: "demo-with-closed", stage: "dev", mode: "recorded", pieces: ["applications"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId("application-security-test-go-app")).toBeVisible();
    await waitFor(() => expect(canvas.getByLabelText("High: 2")).toBeVisible());
    await expect(canvas.getByText("Not running")).toBeVisible();
    await expect(canvas.getByLabelText("No scan data")).toBeVisible();
  },
};

export const ApplicationsColumnNoScanData: Story = {
  args: { scopeKey: "no-data", stage: "qa", mode: "recorded", pieces: ["applications"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByLabelText("No scan data")).toHaveLength(2));
  },
};

export const ApplicationsColumnNotConfigured: Story = {
  args: { scopeKey: "demo", stage: "dev", mode: "notConfigured", pieces: ["applications"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByLabelText("DefectDojo is not connected")).toHaveLength(2));
  },
};

export const ApplicationsColumnUnreachable: Story = {
  args: { scopeKey: "demo", stage: "dev", mode: "unreachable", pieces: ["applications"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByText("DefectDojo is unreachable")).toHaveLength(2));
  },
};

export const OverviewAndApplicationsShareOneFetch: Story = {
  args: { scopeKey: "demo", stage: "dev", mode: "recorded", pieces: ["summary", "applications"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/1 workload containers scanned/)).toBeVisible();
    await expect(await canvas.findByTestId("application-security-test-go-app")).toBeVisible();
    // Products by tags, product count, tests by tags, two test counts.
    await waitFor(() => expect(canvas.getByText(/4 tRPC calls, 5 DefectDojo requests/)).toBeInTheDocument());
  },
};
