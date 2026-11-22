// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Fixtures: recorded from the testbed DefectDojo by `packages/trpc/scripts/prototype-defectdojo-record.ts`.
// The cards stand in for the Environment cards of the CDPipeline Environments tab.
import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import { Alert } from "@/core/components/ui/alert";
import defectDojoTestbed from "@/modules/platform/security/prototype-defectdojo/__fixtures__/defectdojo-testbed.json";
import pipelineScopes from "@/modules/platform/security/prototype-defectdojo/__fixtures__/pipeline-scopes.json";
import {
  createFixtureDefectDojoApi,
  type PrototypeDefectDojoFixtureMode,
} from "@/modules/platform/security/prototype-defectdojo/api/fixtureApi";
import { PrototypeDefectDojoProvider } from "@/modules/platform/security/prototype-defectdojo/api/provider";
import { PrototypeStatePanel } from "@/modules/platform/security/prototype-defectdojo/components/PrototypeStatePanel";
import { EnvironmentCardCounts } from "./EnvironmentCardCounts";

interface HarnessProps {
  /** `key` of a scope of `pipeline-scopes.json`. */
  scopeKey: string;
  mode: PrototypeDefectDojoFixtureMode;
  /** Called with the Stage name when the counts of a card are clicked. */
  onOpen: (stage: string) => void;
}

function Harness({ scopeKey, mode, onOpen }: HarnessProps) {
  const api = React.useMemo(() => createFixtureDefectDojoApi(defectDojoTestbed, mode), [mode]);
  const pipeline = pipelineScopes.find((candidate) => candidate.key === scopeKey);

  if (!pipeline) {
    return <p>No recorded scope with key {scopeKey}.</p>;
  }

  return (
    <PrototypeDefectDojoProvider api={api} cacheScope={`pipeline-${pipeline.cdPipeline}`}>
      <div className="space-y-4">
        {pipeline.note && <Alert>{pipeline.note}</Alert>}
        <div className="flex flex-wrap gap-4">
          {pipeline.environments.map((environment) => (
            <div
              key={environment.stage}
              className="border-border bg-card flex w-52 flex-col rounded-2xl border-2 p-4"
              data-testid={`card-${environment.stage}`}
            >
              <span className="text-foreground text-sm font-semibold">{environment.stage}</span>
              <span className="text-muted-foreground text-xs">No description</span>
              <div className="text-muted-foreground border-border mt-3 border-t pt-3 text-xs">1 quality gates</div>
              <div className="mt-2 w-full">
                <EnvironmentCardCounts
                  pipeline={pipeline}
                  stage={environment.stage}
                  onOpen={() => onOpen(environment.stage)}
                />
              </div>
            </div>
          ))}
        </div>
        <PrototypeStatePanel state={{ pipeline }} />
      </div>
    </PrototypeDefectDojoProvider>
  );
}

const meta: Meta<typeof Harness> = {
  title: "Prototype/DefectDojo/CDPipeline Environment Cards",
  component: Harness,
  decorators: [withAppProviders()],
  parameters: { layout: "padded" },
  args: { onOpen: fn() },
};

export default meta;
type Story = StoryObj<typeof Harness>;

export const Data: Story = {
  args: { scopeKey: "demo", mode: "recorded" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByLabelText("High: 2")).toBeVisible());
    canvas.getByTestId("environment-card-counts-dev").click();
    await expect(args.onOpen).toHaveBeenCalledWith("dev");
  },
};

export const SeveralEnvironments: Story = {
  args: { scopeKey: "dense", mode: "recorded" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByLabelText("High: 20")).toBeVisible());
    // Stage qa has no namespace product: a dash, never zero.
    await expect(within(canvas.getByTestId("card-qa")).getByText("—")).toBeVisible();
  },
};

export const NoScanData: Story = {
  args: { scopeKey: "no-data", mode: "recorded" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText("Security: No scan data")).toBeInTheDocument());
    await expect(canvas.getByText("—")).toBeVisible();
  },
};

export const NotConfigured: Story = {
  args: { scopeKey: "demo", mode: "notConfigured" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText("Security: DefectDojo is not connected")).toBeInTheDocument());
  },
};

export const Unreachable: Story = {
  args: { scopeKey: "demo", mode: "unreachable" },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Unreachable")).toBeVisible();
  },
};
